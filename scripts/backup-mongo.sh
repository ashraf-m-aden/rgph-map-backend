#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="rgph_backup_${TIMESTAMP}"
CONTAINER_NAME="rgph-mongo"
DATABASE="rgph_djibouti_2024"

# Créer le dossier de backup
mkdir -p ${BACKUP_DIR}

echo "🔄 Démarrage du backup de la base de données..."

# Backup avec mongodump
docker exec ${CONTAINER_NAME} mongodump \
  --username admin \
  --password ${MONGO_PASSWORD} \
  --authenticationDatabase admin \
  --db ${DATABASE} \
  --out /tmp/${BACKUP_NAME}

# Copier le backup vers l'hôte
docker cp ${CONTAINER_NAME}:/tmp/${BACKUP_NAME} ${BACKUP_DIR}/

# Nettoyer le conteneur
docker exec ${CONTAINER_NAME} rm -rf /tmp/${BACKUP_NAME}

# Compresser
cd ${BACKUP_DIR} && tar -czf ${BACKUP_NAME}.tar.gz ${BACKUP_NAME}
rm -rf ${BACKUP_NAME}

echo "✅ Backup créé : ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Garder seulement les 7 derniers backups
ls -t ${BACKUP_DIR}/rgph_backup_*.tar.gz | tail -n +8 | xargs -r rm

echo "🗑️  Anciens backups nettoyés"