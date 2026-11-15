# Documentation — API RGPH 2024 (map-backend)

API REST de lecture qui sert les résultats du 3e Recensement général de la
population et de l'habitat de Djibouti (RGPH-3, INSTAD, 2024) au frontend
cartographique (`map-frontend`).

Pour la mise en production, voir [`DEPLOIEMENT.md`](DEPLOIEMENT.md).
Pour les anomalies relevées lors de l'audit, voir [`AUDIT.md`](AUDIT.md).

---

## 1. Pile technique

| Élément | Version | Rôle |
|---|---|---|
| Node.js | 20 (alpine en image) | exécution, ESM (`"type": "module"`) |
| Express | 4.21 | serveur HTTP et routage |
| Mongoose | 8.7 | ODM MongoDB |
| helmet, cors, compression, morgan | — | sécurité, CORS, gzip, logs (dev) |
| express-rate-limit | 7.4 | **déclarée mais jamais montée** (cf. AUDIT B-03) |
| nodemon | 3.1 | rechargement en développement |

Aucun test, aucun linter, aucun typage : le dépôt est du JavaScript nu.

## 2. Arborescence

```
src/
├── server.js                 point d'entrée : cluster optionnel, connexion DB, listen
├── app.js                    application Express : middlewares, montage des routes
├── config/database.js        connectDB() + log de déconnexion
├── models/                   5 schémas Mongoose
│   ├── Region.js             découpage administratif
│   ├── Theme.js              thèmes et sous-thèmes
│   ├── Indicator.js          valeurs d'indicateurs (cœur du modèle)
│   ├── KeyFigure.js          chiffres clés d'un thème
│   └── GeoData.js            FeatureCollection GeoJSON par niveau
├── routes/                   5 routeurs, un par préfixe /api/*
├── controllers/              5 contrôleurs (logique de requête)
└── seeds/                    peuplement de la base (3 scripts)
data/djibouti-regions.geojson GeoJSON des 6 régions, servi en secours
scripts/                      backup / restore mongo (obsolètes, cf. AUDIT B-11)
```

Flux d'une requête : `server.js` → `app.js` (helmet → cors → json → compression
→ morgan → static → routeurs → 404 → gestionnaire d'erreurs) → `routes/*` →
`controllers/*` → Mongoose → MongoDB.

## 3. Démarrage

### Local

```bash
cp .env.example .env          # MONGODB_URI vers un mongo local
npm ci
npm run dev                   # nodemon, http://localhost:5000/api/health
npm run seed:all              # peuple régions, thèmes, geo, indicateurs
```

`seed:all` enchaîne `seeds/index.js`, `seedEconomicData.js` puis
`seedEconomicDataExtended.js` — **l'ordre compte** (cf. AUDIT B-10).

### Variables d'environnement

| Variable | Défaut | Effet réel |
|---|---|---|
| `PORT` | 5000 | port d'écoute (`0.0.0.0`) |
| `NODE_ENV` | development | active `morgan('dev')` et le détail des erreurs |
| `MONGODB_URI` | — | obligatoire ; absence = `process.exit(1)` |
| `CORS_ORIGIN` | `http://localhost:3000` | origine unique autorisée |
| `USE_CLUSTER` | false | `true` = un worker par CPU |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | — | **aucun effet** : jamais lues par le code |

## 4. Modèle de données

Cinq collections, sans relations Mongoose : les liens se font par code métier
(`regionCode`, `themeSlug`, `indicatorCode`), jamais par `ObjectId`.

```
Theme (slug) ──┬── parentSlug ──> Theme          (hiérarchie à 1 niveau exploité)
               └── themeSlug ───> Indicator, KeyFigure

Region (code) ─┬── parentCode ──> Region         (country > region > district > commune)
               └── regionCode ──> Indicator

GeoData (level) ── geojson.features[].properties.code ──> Region.code
```

### Region

`code` (unique, ex. `DJ`, `DJ-DJ`, `DJ-AS`), `level`
(`country|region|district|commune`), `name.{fr,ar,en}` (requis), `parentCode`,
`center.{lat,lng}`, `area` (km²), `geoFeatureId`, `sortOrder`, `isActive`.
Index : `code`, `level`, `parentCode`, `{level, parentCode}`, texte sur les noms.

> Il n'y a **pas** de champ `population` (le frontend en attend un, cf. AUDIT F-08).

### Theme

`slug` (unique), `name.{fr,ar,en}`, `description.*`, `icon` (Material Design
Icons), `color`, `parentSlug`, `sortOrder`, `isPublished`, `sourceDocument`.

### Indicator — table centrale

| Champ | Détail |
|---|---|
| `themeSlug`, `indicatorCode`, `regionCode` | triplet d'identification (non unique) |
| `name.{fr,ar,en}` | requis dans les trois langues |
| `value` | `Mixed` : nombre en pratique |
| `unit` | `number`, `percentage`, `ratio`, `per_thousand`, `per_hundred_thousand`, `years`, `index`, `currency` |
| `disaggregation` | `Map<String,String>` libre : `{ sexe, tranche_age, milieu, secteur, niveau, statut, raison, type, categorie, secteur_inst }` |
| `year` | 2024 par défaut |
| `visualization` | `chartType` (`choropleth`, `bar`, `pie`, `line`, `stacked_bar`, `treemap`, `gauge`, `table`), `colorScale.{min,max}`, `decimals`, `showOnMap` |
| `source` | `{ document, table, page }` — traçabilité vers le Tome 3 |
| `notes.{fr,ar,en}` | — |

Index : `themeSlug`, `indicatorCode`, `regionCode`, `year`, trois index composés
et un index texte sur les noms (ce dernier n'est utilisé par aucune requête).

Un indicateur est une **cellule** : un code, une région, une désagrégation, une
valeur. Une même grandeur existe donc en plusieurs documents (national,
régional, par sexe…) et c'est au consommateur de filtrer.

### KeyFigure

`code` (unique), `label.*`, `value`, `displayValue.*` (déjà formaté par langue),
`unit.*`, `icon`, `color`, `themeSlug`, `sortOrder`, `year`.

### GeoData

`level` (indexé), `geojson` (FeatureCollection : `Polygon`/`MultiPolygon`),
`source`, `lastUpdated`. Une seule entrée peuplée : `level: "region"`.

## 5. Référence des routes

Toutes les routes sont en lecture seule (`GET`). Réponse nominale :
`{ success: true, data: … }` ; erreur : `{ success: false, error: "…" }`.
⚠ marque un écart entre l'intention affichée et le comportement réel.

### Santé

| Route | Réponse |
|---|---|
| `GET /api/health` | `{ status: "ok", service, timestamp }` — **sans** `success` |

### Régions

| Route | Comportement |
|---|---|
| `GET /api/regions` | ⚠ **renvoie la hiérarchie des thèmes**, pas les régions (AUDIT C-01) |
| `GET /api/regions/:code` | une région active, sinon 404 |
| `GET /api/regions/:code/children` | régions dont `parentCode = :code`, triées par `sortOrder` |
| `GET /api/regions/:code/indicators` | tous les indicateurs de la région ; filtres `?themeSlug=&indicatorCode=` |

### Thèmes

| Route | Comportement |
|---|---|
| `GET /api/themes` | thèmes publiés racine, chacun enrichi de `children[]` |
| `GET /api/themes/:slug` | `{ theme, indicators: [{ code, name, unit, visualization }], subThemes }` ; `indicators` vient de `distinct('indicatorCode')` puis d'un `findOne` par code |
| `GET /api/themes/:slug/key-figures` | chiffres clés du thème, triés par `sortOrder` |

### Indicateurs

| Route | Comportement |
|---|---|
| `GET /api/indicators` | ⚠ **renvoie la hiérarchie des thèmes** (AUDIT C-02) |
| `GET /api/indicators/by-theme/:themeSlug` | regroupé par code : `[{ code, name, unit, visualization, data: [{ regionCode, value, disaggregation }] }]` ; filtres `?regionCode=` ou `?level=` |
| `GET /api/indicators/map-data/:indicatorCode` | `?level=region` (défaut), `?disaggregation={"sexe":"masculin"}` (JSON encodé) → `{ indicatorCode, mapData: [{ regionCode, regionName, center, value, unit }], scale: { min, max }, visualization }`. Une entrée par région du niveau, `value: null` si la donnée manque |
| `GET /api/indicators/compare` | `?indicator=&regions=DJ-AS,DJ-AR` → documents bruts ; 400 si un paramètre manque |
| `GET /api/indicators/chart-data/:indicatorCode` | `?level=region&groupBy=region` → `{ labels, datasets: [{ data }] }` ; ⚠ `labels` contient des objets `{fr,ar,en}` (AUDIT B-06) |

Noter la divergence de syntaxe pour la désagrégation : JSON encodé sur
`map-data`, forme `disaggregation.sexe=…` dans le code mort de
`indicatorController.getAll`.

### Géographie

| Route | Comportement |
|---|---|
| `GET /api/geo/:level` | GeoData du niveau ; à défaut le fichier `data/djibouti-regions.geojson` ⚠ quel que soit le niveau demandé (AUDIT B-08) ; sinon 404. `Cache-Control: public, max-age=86400` |
| `GET /data/<fichier>` | dossier `data/` servi tel quel (le GeoJSON est donc accessible par deux chemins) |

### Recherche

| Route | Comportement |
|---|---|
| `GET /api/search?q=&lang=fr` | 400 si `q` fait moins de 2 caractères. Recherche par expression régulière sur `name.<lang>` dans les trois collections → `{ themes: [{slug,name,icon}], regions: [{code,name,level}], indicators: [{code,name,themeSlug,unit}] }` (5/5/10 résultats, indicateurs dédoublonnés par code) |

## 6. Jeu de données livré par les seeds

| Script | Contenu | Remise à zéro |
|---|---|---|
| `seeds/index.js` | 7 régions (1 pays + 6 régions), 7 thèmes, 1 GeoData | `deleteMany({})` sur Region, Theme, GeoData |
| `seedEconomicData.js` | 9 chiffres clés + 172 indicateurs | `deleteMany({ themeSlug: 'caracteristiques-economiques' })` |
| `seedEconomicDataExtended.js` | 288 indicateurs supplémentaires | **aucune** (AUDIT B-10) |

Total : **460 documents `Indicator`, 64 codes distincts**, tous rattachés au seul
thème `caracteristiques-economiques` (Tome 3). Les 6 autres thèmes
(`demographie`, `education`, `sante`, `habitat`, `langue-maternelle`,
`pauvrete`) existent mais sont vides.

Couverture géographique des 64 codes :

* **30 codes** couvrent les 6 régions → exploitables en choroplèthe
  (`taux_chomage_bit_region`, `pop_15plus`, `chomeurs_region`,
  `secteur_primaire_region`…) ;
* **34 codes** n'existent que pour `regionCode: "DJ"` (national), souvent
  ventilés par sexe, âge, milieu ou niveau d'instruction → invisibles sur une
  carte `level=region` (AUDIT D-02).

Codes de régions : `DJ` (pays), `DJ-DJ` Djibouti, `DJ-AR` Arta, `DJ-AS` Ali
Sabieh, `DJ-DI` Dikhil, `DJ-OB` Obock, `DJ-TA` Tadjourah. Aucun district ni
commune n'est peuplé.

Cohérences vérifiées : somme régionale de `pop_15plus` = 659 908 = national ;
somme de `pop_active_region` = 330 726 = national ; `taux_activite` =
330 726 / 659 908 = 50,1 % ; actifs occupés + chômeurs + découragés =
population active, région par région. Incohérences relevées : cf. AUDIT D-03 à
D-07.

## 7. Sécurité et exploitation

* `helmet()` dans sa configuration par défaut ; CORS limité à `CORS_ORIGIN`
  (origine unique) avec `credentials: true` bien qu'aucune session ne soit
  utilisée.
* **Aucune limitation de débit effective** malgré la dépendance et les variables
  d'environnement (AUDIT B-03), et **aucune pagination** (AUDIT B-09) : une
  requête peut rapatrier l'ensemble des indicateurs.
* API strictement en lecture : pas de route d'écriture, pas d'authentification.
  Toute modification de données passe par un seed exécuté à la main.
* Les messages d'erreur détaillés ne sortent qu'en `NODE_ENV=development`.
* Journalisation HTTP (`morgan`) désactivée hors développement : en production
  les traces d'accès viennent du nginx de l'hôte.
* `GET /api/geo/:level` est la seule réponse mise en cache (24 h).
