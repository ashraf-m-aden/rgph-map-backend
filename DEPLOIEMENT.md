# Deploiement — API carte interactive RGPH 2024

API Express/Mongoose hebergee sur le **meme EC2 que le site INSTAD**, derriere
le nginx de l'hote. Servie sous `https://rgph.instad.dj/api`.

L'infrastructure (docker-compose, vhost nginx, scripts, sauvegardes) vit dans le
depot **`instad-infra`** — c'est la qu'il faut regarder pour la mise en service
du serveur. Ce fichier ne documente que ce qui concerne ce depot.

## Architecture

```
navigateur
    │  https://rgph.instad.dj/api/...
    ▼
nginx de l'hote EC2  (TLS, vhost rgph.instad.dj.conf dans instad-infra)
    └── /api/  → 127.0.0.1:5001 → conteneur rgph-map-backend  (Express, 5000)
                                      │
                                      ▼
                                 conteneur mongo (partage avec INSTAD)
                                 base rgph_djibouti_2024
```

Toutes les routes de cette API sont deja prefixees par `/api`
(`src/app.js`), donc nginx proxyfie sans reecriture. Le frontend etant servi
sur le meme domaine, les appels du navigateur sont en meme origine :
`CORS_ORIGIN` ne sert plus que de garde-fou.

## MongoDB

Le conteneur `mongo` est **partage avec le site INSTAD**, sur une base distincte
`rgph_djibouti_2024`. A savoir :

- Les sauvegardes journalieres de `instad-infra` couvrent deja cette base
  (`mongodump` sans `--db` archive toutes les bases).
- A l'inverse, une restauration via `restore-mongo-from-s3.sh` ramene **les deux
  bases** a l'etat du backup (`--drop` est actif). Pour n'en restaurer qu'une,
  utiliser `mongorestore --nsInclude 'rgph_djibouti_2024.*'`.

## Variables d'environnement

En production elles viennent de `/opt/instad/.env.map` sur l'EC2 (modele :
`instad-infra/.env.map.example`). Fichier **distinct** de `.env` parce que les
deux backends se contrediraient : `PORT` vaut 3001 pour INSTAD et 5000 ici.

| Variable | Role |
|---|---|
| `PORT` | 5000 (publie en 5001 sur l'hote) |
| `MONGODB_URI` | base `rgph_djibouti_2024` du conteneur `mongo` |
| `CORS_ORIGIN` | `https://rgph.instad.dj` |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | limitation de debit |
| `USE_CLUSTER` | `false` — la machine est partagee, un worker suffit |

Aucun build-arg : l'image est independante de l'environnement, ces valeurs sont
lues au demarrage du conteneur.

## Peupler la base

A faire une seule fois apres la mise en service :

```bash
docker compose exec map-backend npm run seed:all
```

Note : `npm run seed:geo` et `seed:demo` referencent des fichiers absents du
depot (`src/seeds/seedGeoData.js`, `seedDemoData.js`) et echouent. `seed:all`
n'utilise que les trois seeds existants.

## Developpement local

```bash
cp .env.example .env     # MONGODB_URI=mongodb://localhost:27017/rgph_djibouti_2024
npm ci
npm run dev              # http://localhost:5000/api/health
```

## Chaine de deploiement

Un push sur `main` declenche `.github/workflows/deploy.yml` :

1. build de l'image et push sur Docker Hub
   (`<user>/rgph-map-backend:latest` et `:<sha-court>`) ;
2. connexion SSH a l'EC2 et `/opt/instad/scripts/deploy.sh map-backend`, qui ne
   redemarre **que ce service** — le site INSTAD et le frontend de la carte ne
   sont pas interrompus.

Secrets GitHub requis : `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `EC2_HOST`,
`EC2_USER`, `EC2_SSH_KEY`.

## Verifier

```bash
curl -s https://rgph.instad.dj/api/health
```
