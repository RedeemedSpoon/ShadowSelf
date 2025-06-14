#!/bin/bash
set -e

REMOTE_USER="root"
REMOTE_HOST="shadowself.io"

DB_USER=$(grep POSTGRES_USER ${SHADOWSELF_PATH}/application/database/.env | cut -d '=' -f2)
DB_PASSWORD=$(grep POSTGRES_PASSWORD ${SHADOWSELF_PATH}/application/database/.env | cut -d '=' -f2)
DB_NAME=$(grep POSTGRES_DB ${SHADOWSELF_PATH}/application/database/.env | cut -d '=' -f2)

echo "Backing up database..."
ssh -i "$SSH_KEY" ${REMOTE_USER}@${REMOTE_HOST} "
  set -e
  CONTAINER_ID=\$(docker ps -q --filter 'label=com.docker.compose.project=shadowself-core' --filter 'ancestor=postgres')
  docker exec -e PGPASSWORD=${DB_PASSWORD} \$CONTAINER_ID \
    pg_dump -U ${DB_USER} -d ${DB_NAME} | gzip > db_backup.sql.gz
"

scp "$REMOTE_USER@$REMOTE_HOST:/root/db_backup.sql.gz ."
ssh "$REMOTE_USER@$REMOTE_HOST" "rm /root/db_backup.sql.gz"
echo "Database backup completed."
