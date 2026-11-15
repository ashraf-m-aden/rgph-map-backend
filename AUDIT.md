# Audit — API RGPH 2024 (map-backend)

Revue de code complète du backend et du jeu de données, menée le 15 novembre
2026 sur la branche `docs/audit-architecture` (base : `feat/deploy-ec2`).

Identifiants : `C-xx` contrat d'API (impacte aussi le frontend), `B-xx` backend,
`D-xx` données. Les anomalies du frontend sont dans
`map-frontend/AUDIT.md` (`F-xx`).

## État des corrections

Branche `fix/audit-bloquants-majeurs` (depuis `docs/audit-architecture`) :
**corrigés et vérifiés sur une base MongoDB réelle** — C-01, C-02, B-03, B-04,
B-05, B-06, B-07, B-08, B-09, B-10, B-11, B-12, B-13, B-14, B-15, B-16, B-17,
B-18, B-20, D-11.

**Restent ouverts** (données à reprendre dans le Tome 3, hors portée d'un
correctif de code) : D-01, D-02, D-03, D-04, D-05, D-06, D-07, D-08, D-09,
D-10. D-01 et D-02 sont contournés côté interface — la carte d'accueil pointe
sur un indicateur régional existant et l'API expose `hasRegionalData` — mais
les données manquantes restent manquantes.

---

Sévérité : 🔴 bloquant · 🟠 majeur · 🟡 mineur.
Colonne « Vérif. » : **exécuté** = reproduit par exécution de code,
**lecture** = établi par lecture du code.

## Synthèse

| ID | Sév. | Anomalie | Vérif. |
|---|---|---|---|
| C-01 | 🔴 | `GET /api/regions` renvoie les **thèmes** au lieu des régions | exécuté |
| C-02 | 🔴 | `GET /api/indicators` renvoie les **thèmes** au lieu des indicateurs | exécuté |
| B-03 | 🟠 | Aucune limitation de débit malgré la dépendance et les variables documentées | lecture |
| B-04 | 🟠 | `scale.min/max` vaut `null` quand aucune valeur n'existe (`Math.min()` de tableau vide) | lecture |
| B-05 | 🟠 | `map-data` / `chart-data` ignorent la désagrégation lors de l'appariement région → valeur | exécuté |
| B-06 | 🟠 | `chart-data` renvoie des objets `{fr,ar,en}` comme libellés d'axe | lecture |
| B-07 | 🟠 | `/api/search` construit une `RegExp` à partir de l'entrée utilisateur non échappée | lecture |
| B-08 | 🟠 | `/api/geo/:level` renvoie les régions pour **n'importe quel** niveau | lecture |
| B-09 | 🟠 | Aucune pagination : 460 documents renvoyés en un appel | exécuté |
| B-10 | 🟠 | Le seed étendu ne purge rien → doublons à chaque exécution | lecture |
| D-01 | 🟠 | `population_totale` n'existe qu'au national → carte d'accueil vide | exécuté |
| D-02 | 🟠 | 31 des 64 codes d'indicateurs n'ont aucune donnée régionale | exécuté |
| D-03 | 🟠 | Population inactive : trois totaux contradictoires | exécuté |
| B-11 | 🟡 | Scripts npm pointant des fichiers absents (`seed:geo`, `seed:demo`, `docker:*`, backup) | lecture |
| B-12 | 🟡 | `.env` suivi par git | exécuté |
| B-13 | 🟡 | `/api/themes/:slug` : métadonnées prises sans filtre de thème + N+1 requêtes | lecture |
| B-14 | 🟡 | `express.static('data')` en chemin relatif au répertoire courant | lecture |
| B-15 | 🟡 | `SIGTERM`/`SIGINT` : arrêt brutal sans fermeture du serveur ni de mongoose | lecture |
| B-16 | 🟡 | `/api/health` est la seule réponse sans enveloppe `success` | lecture |
| B-17 | 🟡 | Imports inutilisés, imports `path` en double, `console.log` de débogage | exécuté |
| B-18 | 🟡 | `credentials: true` sans session ; `CORS_ORIGIN` mono-origine | lecture |
| B-20 | 🟡 | Recherche sensible aux accents : « chomage » ne trouve rien | exécuté |
| D-04 | 🟡 | `raisons_non_emploi` ne somme qu'à 96,1 % | exécuté |
| D-05 | 🟡 | Doublon exact sous deux codes : `effectif_actifs_occupes_region` / `actifs_occupes_region` | exécuté |
| D-06 | 🟡 | `chomeurs_effectif` contient les chômeurs **élargis** mais s'intitule « Chômeurs » | exécuté |
| D-07 | 🟡 | `pop_inactive_pct` est une part du total national présentée comme un taux régional | exécuté |
| D-08 | 🟡 | 6 thèmes sur 7 sans aucune donnée | exécuté |
| D-09 | 🟡 | GeoJSON grossier, dupliqué et divergent entre les deux dépôts ; aucun district | exécuté |
| D-10 | 🟡 | Libellés `ar` / `en` recopiés du français dans deux séries | exécuté |
| D-11 | 🟡 | `rapport_dependance` (262 à 409) déclaré en `percentage` au lieu de `ratio` | exécuté |

---

## Contrat d'API

### C-01 🔴 `GET /api/regions` renvoie les thèmes

`src/routes/regions.js:2` importe `getAll` depuis **`themeController`** et le
monte sur `/` (ligne 7). `regionController.getAll` — qui gère pourtant les
filtres `level` et `parentCode` et le tri `sortOrder` — n'est jamais monté.

Vérification par introspection du routeur Express :

```
GET /api/regions     ->  themeController.getAll
GET /api/indicators  ->  themeController.getAll
GET /api/themes      ->  themeController.getAll
```

Conséquence : tout appel à la liste des régions reçoit la hiérarchie des thèmes
avec `success: true`. L'erreur est silencieuse. Côté frontend
`useApi.getRegions()` existe mais n'est appelée nulle part, ce qui a masqué le
défaut jusqu'ici ; toute page qui listerait les régions (sélecteur, tableau,
comparaison) tomberait dessus.

**Correctif** : importer `getAll` depuis `../controllers/regionController.js`.

### C-02 🔴 `GET /api/indicators` renvoie les thèmes

Même cause dans `src/routes/indicators.js:3` et `:8`.
`indicatorController.getAll` (filtres `theme`, `indicator`, `region`, `year`,
`disaggregation.*`) est mort.

À noter une fois le routage corrigé : la documentation de la route annonce
`?disaggregation[sexe]=masculin`, alors que le code ne reconnaît que
`?disaggregation.sexe=masculin` — Express transforme la première forme en objet
imbriqué, dont la clé `disaggregation` ne satisfait pas
`key.startsWith('disaggregation.')` et qui est donc ignorée.

**Correctif** : importer `getAll` depuis `../controllers/indicatorController.js`,
et aligner la syntaxe de désagrégation sur celle de `map-data`.

---

## Backend

### B-03 🟠 Limitation de débit absente

`express-rate-limit` figure dans `package.json`, `RATE_LIMIT_WINDOW_MS` et
`RATE_LIMIT_MAX` sont documentées dans `.env.example`, `.env` et
`DEPLOIEMENT.md` — mais `src/app.js` ne monte aucun middleware de limitation.
L'API publique, sans authentification ni pagination, est donc exposée sans
garde-fou.

**Correctif** : monter `rateLimit({ windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, max: Number(process.env.RATE_LIMIT_MAX) || 100 })` sur `/api`, ou retirer la dépendance et la documentation si le choix est de s'en remettre au nginx de l'hôte.

### B-04 🟠 Échelle de couleurs nulle sur données absentes

`src/controllers/indicatorController.js:115-116` :

```js
const values = mapData.filter(d => d.value !== null).map(d => d.value);
const min = Math.min(...values);   // Infinity  si values est vide
const max = Math.max(...values);   // -Infinity
```

`JSON.stringify(Infinity)` produit `null` : la réponse annonce
`scale: { min: null, max: null }` sans signaler que l'indicateur n'a aucune
donnée au niveau demandé. C'est le cas de 31 codes sur 64 (D-02).

Deux défauts secondaires au même endroit : `value` est typé `Mixed`, aucune
vérification numérique n'est faite ; et l'étalement d'un tableau en arguments
(`Math.min(...values)`) casse au-delà de ~100 000 éléments.

**Correctif** : `const nums = mapData.map(d => d.value).filter(v => typeof v === 'number')` puis `scale: nums.length ? { min: Math.min.apply(null, nums), max: … } : null`, et exposer un indicateur explicite de données manquantes.

### B-05 🟠 Appariement région → valeur aveugle à la désagrégation

`indicatorController.js:103` (et `:178` pour `chart-data`) :

```js
const ind = indicators.find(i => i.regionCode === region.code);
```

Dès que plusieurs documents partagent `indicatorCode` + `regionCode` avec des
désagrégations différentes, `find` retient le **premier renvoyé par MongoDB**,
dans un ordre non garanti — la carte affiche alors une valeur au hasard parmi
« ensemble », « masculin », « féminin ».

Contrôle exécuté sur les 460 documents actuels : aucun code ne présente
aujourd'hui plusieurs documents pour une même région de niveau 2. Le défaut est
donc **latent** : il se déclenchera au premier seed régional ventilé (par
exemple `taux_chomage_bit_region` par sexe), sans message d'erreur.

**Correctif** : quand aucune désagrégation n'est demandée, filtrer sur
`disaggregation` vide (`{ $in: [null, {}] }` ou un champ `isTotal`), et refuser
la requête si le couple reste ambigu.

### B-06 🟠 Libellés d'axe non sérialisés en texte

`indicatorController.js:175` : `chartData.labels = regions.map(r => r.name)` —
`name` est l'objet `{ fr, ar, en }`. Un consommateur qui branche la réponse sur
Chart.js affiche `[object Object]`. L'endpoint n'accepte d'ailleurs aucun
paramètre de langue.

**Correctif** : accepter `?lang=fr|ar|en` et renvoyer `r.name[lang] ?? r.name.fr`.

### B-07 🟠 Expression régulière construite depuis l'entrée utilisateur

`src/controllers/searchController.js:13-14` :

```js
const searchField = `name.${lang}`;
const regex = new RegExp(q, 'i');
```

`q` n'est pas échappé : un motif comme `(a+)+$` suffit à provoquer un retour
arrière catastrophique (ReDoS) sur trois collections simultanément, sans
limitation de débit pour l'absorber (B-03). `lang` n'est pas validé non plus et
sert à construire un chemin de champ.

Accessoirement, les index texte déclarés sur `name.fr/ar/en` dans les trois
modèles ne sont jamais utilisés : la recherche par `RegExp` sans ancrage ne peut
pas s'appuyer sur un index.

**Correctif** : échapper `q` (`q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')`),
restreindre `lang` à `['fr','ar','en']`, et préférer `$text: { $search: q }`
pour exploiter les index existants.

### B-08 🟠 `/api/geo/:level` ignore le niveau dans son repli

`src/controllers/geoController.js:25-30` : si aucun `GeoData` ne correspond au
niveau, le contrôleur sert `data/djibouti-regions.geojson` **sans vérifier le
niveau demandé**. `GET /api/geo/commune` répond donc `200` avec les 6 régions,
et `level` n'est pas validé contre l'énumération du modèle.

Le même fichier contient trois autres scories : `dotenv.config()` appelé dans un
contrôleur (ligne 11, inutile — `server.js` le fait déjà), un
`console.log(level)` de débogage (ligne 16), et un bloc final inatteignable
(`res.json(geoData.geojson)` après le `return` du repli).

**Correctif** : valider `level` contre
`['country','region','district','commune']`, ne servir le repli que pour
`region`, répondre 404 autrement.

### B-09 🟠 Aucune pagination ni plafond

`/api/indicators` (une fois C-02 corrigé), `/api/indicators/by-theme/:slug` et
`/api/regions/:code/indicators` renvoient tous les documents correspondants.
Sur le jeu actuel, `by-theme/caracteristiques-economiques` renvoie les 460
documents en un appel ; la page région en reçoit jusqu'à 70. Aucun `limit`,
aucun `skip`, aucun `.lean()` (les documents Mongoose complets sont
hydratés puis sérialisés).

**Correctif** : `?limit` / `?offset` plafonnés, et `.lean()` sur les lectures.

### B-10 🟠 Seeds non idempotents

`src/seeds/seedEconomicDataExtended.js:1132` appelle `insertMany` sans
`deleteMany` préalable. Aucun index unique ne protège le triplet
(`indicatorCode`, `regionCode`, `disaggregation`) : **chaque exécution duplique
les 288 documents**, et les doublons deviennent invisibles puisque `find` en
retient un au hasard (B-05).

Dépendance d'ordre à l'inverse : `seedEconomicData.js` fait
`deleteMany({ themeSlug: 'caracteristiques-economiques' })`, donc lancer
`npm run seed:economic` seul **détruit les 288 indicateurs étendus**. Seul
l'enchaînement complet `seed:all` produit un état correct.

**Correctif** : purger par `themeSlug` dans le seed étendu (ou par
`source.document`), ajouter un index unique sur le triplet, et documenter
l'ordre dans le script `seed:all` lui-même.

### B-11 🟡 Scripts npm pointant du vide

* `seed:geo` → `src/seeds/seedGeoData.js` : fichier absent.
* `seed:demo` → `src/seeds/seedDemoData.js` : fichier absent.
* `docker:up` / `down` / `logs` / `rebuild` → aucun `docker-compose.yml` dans le
  dépôt (l'orchestration vit dans `instad-infra`).
* `docker:backup` / `docker:restore` → `scripts/backup-mongo.sh` et
  `restore-mongo.sh` visent un conteneur `rgph-mongo` et une variable
  `MONGO_PASSWORD` qui ne correspondent plus à l'infrastructure décrite dans
  `DEPLOIEMENT.md` (conteneur `mongo` partagé, sauvegardes assurées par
  `instad-infra`). Ces scripts sont par ailleurs exclus de l'image par
  `.dockerignore`, donc inutilisables via `docker compose exec`.

**Correctif** : supprimer les six scripts obsolètes, ou les faire pointer vers
l'infrastructure réelle.

### B-12 🟡 `.env` suivi par git

`git ls-files` confirme que `.env` est versionné dans les deux dépôts, alors que
`.gitignore` n'ignore que `.env.local`. Les valeurs actuelles sont inoffensives
(mongo local sans mot de passe), mais le fichier est le réceptacle naturel d'un
futur `MONGODB_URI` avec identifiants.

**Correctif** : ajouter `.env` au `.gitignore` et
`git rm --cached .env` dans les deux dépôts.

### B-13 🟡 `/api/themes/:slug` : métadonnées imprécises et N+1

`src/controllers/themeController.js:38` :
`Indicator.findOne({ indicatorCode: code })` — **sans** `themeSlug`. Si un même
code existait dans deux thèmes, le nom et l'unité affichés pourraient provenir
de l'autre thème. La boucle exécute en outre une requête par code (64 requêtes
pour le thème économique) là où une agrégation `$group` suffirait.

### B-14 🟡 Service de fichiers statiques en chemin relatif

`src/app.js:40` : `express.static('data')` est résolu depuis le répertoire de
travail du processus, pas depuis le fichier. Correct sous Docker
(`WORKDIR /app`), cassé dès qu'on lance `node src/server.js` depuis un autre
dossier. À noter aussi que cette route expose le GeoJSON brut en parallèle de
`/api/geo/:level`, sans en-tête de cache.

**Correctif** : `express.static(path.join(__dirname, '../data'))`.

### B-15 🟡 Arrêt non gracieux

`src/server.js` : `SIGTERM` et `SIGINT` appellent directement
`process.exit(0)`, sans `server.close()` ni `mongoose.connection.close()`. Les
requêtes en cours sont coupées net à chaque redéploiement. En mode cluster, le
processus maître ne relaie pas le signal à ses workers.

### B-16 🟡 Enveloppe de réponse non uniforme

`/api/health` renvoie `{ status, service, timestamp }` quand toutes les autres
routes renvoient `{ success, data }`. Les gestionnaires 404 et d'erreur, eux,
renvoient `{ error }` sans `success: false`, contrairement aux 404 métier des
contrôleurs. Un client générique ne peut pas s'appuyer sur une forme unique.

### B-17 🟡 Scories de code

* Imports inutilisés : `Theme` dans `indicatorController.js` et
  `regionController.js`, `Region` dans `themeController.js`, `mongoose` dans les
  trois seeds.
* `src/seeds/index.js` importe deux fois le module `path` (lignes 5 et 6 :
  `{ dirname, join }` puis `path`).
* `console.log(level)` dans `geoController.js:16`.
* `src/config/database.js:1` : `import mongoose from'mongoose'` (espace manquant)
  et un bloc d'options vide avec commentaire.

### B-18 🟡 CORS

`cors({ origin: CORS_ORIGIN, credentials: true })` : `credentials` est inutile
(aucun cookie, aucune session) et `origin` n'accepte qu'une seule valeur, ce qui
interdit par exemple un environnement de recette en parallèle de la production.
Par ailleurs `composables/useApi.ts` du frontend envoie un en-tête
`Content-Type: application/json` sur des `GET`, ce qui force une requête
préalable `OPTIONS` à chaque appel en cross-origin (sans effet en production,
où tout est en même origine).

### B-20 🟡 Recherche sensible aux accents

Relevé en interrogeant l'API peuplée : `GET /api/search?q=chomage` renvoie zéro
résultat alors que `q=chômage` en renvoie six. Tous les libellés de la base
étant accentués, la recherche échouait sur la saisie naturelle d'un clavier
sans accent — le défaut le plus probable pour un visiteur.

**Correctif appliqué** : `buildSearchRegex` (`src/utils/query.js`) échappe la
saisie puis étend chaque voyelle en classe de caractères (`o` → `[oôöóòõ…]`).
Le motif reste entièrement construit par le code, donc sans risque de ReDoS
(B-07). Vérifié : `chomage`, `chômage` et `CHOMAGE` renvoient les mêmes six
indicateurs, et `education` trouve désormais le thème « Éducation et
analphabétisme ».

---

## Données

### D-01 🟠 `population_totale` : la carte d'accueil n'a rien à afficher

La page d'accueil du frontend appelle
`GET /api/indicators/map-data/population_totale` (niveau `region` par défaut).
Or ce code n'est semé qu'une seule fois, pour `regionCode: "DJ"` (national),
dans `seedEconomicDataExtended.js:1115`.

La réponse contient donc 6 entrées régionales toutes à `value: null` et
`scale: { min: null, max: null }`. Côté frontend le repli local n'est pas
déclenché (le tableau n'est pas vide), la carte s'affiche entièrement grise et
sans étiquette. C'est l'anomalie la plus visible de l'ensemble.

**Correctif** : semer `population_totale` pour les 6 régions (données du Tome 1
du RGPH), ou faire pointer la page d'accueil sur un code effectivement régional
tel que `pop_15plus`.

### D-02 🟠 Plus de la moitié des indicateurs sont invisibles sur une carte

Sur les 64 codes distincts, **31 n'existent qu'au niveau national** (`DJ`) :
ventilations par sexe, tranche d'âge, milieu, niveau d'instruction, statut
matrimonial, branche et secteur institutionnel. Comme `map-data` filtre sur
`level=region`, ces codes renvoient 6 valeurs nulles.

Le sélecteur d'indicateurs de la page thème est pourtant alimenté par la liste
complète : l'utilisateur peut choisir 31 entrées qui n'afficheront rien.

Rien dans le modèle ne distingue un indicateur national d'un indicateur
régional. `visualization.showOnMap` vaut `true` pour tous.

**Correctif** : renseigner `showOnMap` correctement dans les seeds et le
respecter dans `getBySlug`, ou ajouter un champ `levels: ['country','region']`
et filtrer la liste côté API.

### D-03 🟠 Population inactive : trois totaux incompatibles

| Source | Valeur |
|---|---|
| `pop_15plus` (national) − `pop_active_region` (national) | **329 182** |
| `pop_inactive` (national, semé) | **563 279** |
| Somme de `pop_inactive_region` sur les 6 régions | **477 744** |

Les trois ne peuvent pas décrire la même grandeur. Indices recueillis :
`pop_inactive_pct` (73,4 % pour Djibouti-ville) est cohérent avec la somme
régionale 477 744 (350 658 / 477 744 = 73,4 %), pas avec 563 279 ; et
`raisons_non_emploi_effectif` somme à 540 760, soit 96 % de 563 279. Le champ
`pop_inactive` semble donc porter sur une population de référence différente
(population de 10 ans et plus ?) de celle des indicateurs régionaux.

Les autres totaux ont été vérifiés et sont cohérents : somme régionale de
`pop_15plus` = 659 908 = national ; somme de `pop_active_region` = 330 726 =
national ; par région, actifs occupés + chômeurs + découragés = population
active.

**Correctif** : reprendre les trois séries dans le Tome 3 et expliciter la
population de référence (champ `notes` ou `disaggregation.base`).

### D-04 🟡 `raisons_non_emploi` : 96,1 % seulement

Les 11 modalités somment à 96,1 % et leurs effectifs à 540 760 contre
563 279 pour `pop_inactive` — même écart de ~4 % (22 519 personnes) dans les
deux unités, ce qui écarte l'erreur de saisie et désigne une **modalité absente**
du seed. La catégorie « Autres raisons » existant déjà (13,8 %), l'écart ne peut
pas y être fondu sans vérification.

### D-05 🟡 Doublon exact sous deux codes

`effectif_actifs_occupes_region` (seed de base) et `actifs_occupes_region` (seed
étendu) portent **les mêmes six valeurs** (144 734, 9 091, 6 217, 7 333, 6 352,
8 437) ; le second ajoute seulement le total national. Deux entrées identiques
apparaissent donc dans le sélecteur d'indicateurs.

**Correctif** : supprimer `effectif_actifs_occupes_region`.

### D-06 🟡 `chomeurs_effectif` désigne les chômeurs élargis

Pour Djibouti-ville : `chomeurs_region` = 87 954, `chomeurs_effectif` = 115 466.
Or 87 954 chômeurs + 27 512 découragés = 115 466 : `chomeurs_effectif` est donc
le **chômage élargi**, alors que son libellé et son code ne le disent pas.
Les deux séries sont affichées côte à côte sans désagrégation permettant de les
distinguer.

**Correctif** : renommer en `chomeurs_elargi_effectif` et ajouter
`disaggregation: { type: 'elargi' }`, à l'image des séries
`taux_chomage_*_elargi`.

### D-07 🟡 `pop_inactive_pct` : part nationale présentée comme un taux

Les six valeurs (73,4 / 7,2 / 6,5 / 5,9 / 3,2 / 3,9) somment à 100 : il s'agit
de la **répartition régionale des inactifs**, pas du taux d'inactivité de chaque
région. Avec `unit: 'percentage'` et `chartType: 'choropleth'`, la carte se lit
comme « 73,4 % d'inactifs à Djibouti-ville », ce qui est faux. Le panneau
régional du frontend calcule par ailleurs sa propre « % du total », qui
dupliquerait cette même grandeur.

**Correctif** : renommer `part_inactifs_national` et/ou introduire une unité
`share_of_total`.

### D-08 🟡 Six thèmes sur sept sont vides

Seul `caracteristiques-economiques` possède des données. `demographie`,
`education`, `sante`, `habitat`, `langue-maternelle` et `pauvrete` sont semés
avec nom, description, icône et couleur, donc exposés par `/api/themes` et
affichés dans la barre latérale : six entrées de menu mènent à une page vide.

**Correctif** : passer `isPublished: false` sur les thèmes sans données
(`getAll` et `getBySlug` filtrent déjà sur ce champ) jusqu'à leur alimentation.

### D-09 🟡 GeoJSON approximatif et dupliqué

`map-backend/data/djibouti-regions.geojson` et
`map-frontend/assets/data/djibouti-regions.json` décrivent les mêmes 6 régions
mais **divergent** : 12 à 27 points par polygone côté backend, 7 à 13 côté
frontend, et la propriété `capital` n'existe que côté backend. Les deux sont des
tracés très grossiers, sans rapport avec les limites administratives réelles, et
aucune donnée `district` ou `commune` n'existe alors que l'interface propose un
sélecteur de niveau « Districts ».

**Correctif** : une seule source de vérité (le fichier du backend, servi par
`/api/geo`), un tracé officiel, et masquer le niveau district jusqu'à ce qu'il
existe.

### D-10 🟡 Libellés arabes et anglais non traduits

Dans `seedEconomicData.js`, la série `secteur_institutionnel` est semée avec
`{ fr: s.fr, ar: s.fr, en: s.fr }` : le français est recopié dans les trois
langues. Dans `seedEconomicDataExtended.js`, `secteur_inst_sexe` utilise
`{ fr: …, ar: s.code, en: s.code }` : les versions arabe et anglaise affichent le
**code technique** (`public_admin`, `prive_informel`…). Le modèle impose les
trois langues, la contrainte est donc satisfaite formellement mais pas
réellement.

### D-11 🟡 Rapport de dépendance : une unité fausse

Relevé en affichant la fiche d'Ali Sabieh : `rapport_dependance` vaut 376,7 et
`rapport_dependance_milieu` jusqu'à 408,8 — ce sont des rapports (« inactifs
pour 100 actifs »), mais ils étaient semés avec `unit: 'percentage'`. Sur un
graphique regroupant les pourcentages d'une région, cette série écrasait
l'échelle : les taux réellement bornés à 100 devenaient illisibles.

L'énumération du modèle contient déjà `ratio`.

**Correctif appliqué** : les trois entrées passent en `unit: 'ratio'` dans
`seedEconomicDataExtended.js`. L'interface regroupe un graphique par unité, le
ratio a donc sa propre échelle.
