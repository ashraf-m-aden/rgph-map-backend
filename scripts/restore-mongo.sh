#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: ./restore-mongo.sh <backup_file.tar.gz>"
  exit 1
fi

BACKUP_FILE=$1
CONTAINER_NAME="rgph-mongo"
DATABASE="rgph_djibouti_2024"

echo "🔄 Restauration depuis ${BACKUP_FILE}..."

# Décompresser
BACKUP_DIR=$(basename ${BACKUP_FILE} .tar.gz)
tar -xzf ${BACKUP_FILE}

# Copier vers le conteneur
docker cp ${BACKUP_DIR} ${CONTAINER_NAME}:/tmp/

# Restaurer
docker exec ${CONTAINER_NAME} mongorestore \
  --username admin \
  --password ${MONGO_PASSWORD} \
  --authenticationDatabase admin \
  --db ${DATABASE} \
  /tmp/${BACKUP_DIR}/${DATABASE}

# Nettoyer
rm -rf ${BACKUP_DIR}
docker exec ${CONTAINER_NAME} rm -rf /tmp/${BACKUP_DIR}

echo "✅ Restauration terminée"