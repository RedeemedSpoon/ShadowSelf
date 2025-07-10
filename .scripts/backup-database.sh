#!/bin/bash
set -e

REMOTE_USER="root"
REMOTE_HOST="shadowself.io"

DB_USER=$(grep POSTGRES_USER ${LOCAL_PATH}/application/database/.env | cut -d '=' -f2)
DB_PASSWORD=$(grep POSTGRES_PASSWORD ${LOCAL_PATH}/application/database/.env | cut -d '=' -f2)
DB_NAME=$(grep POSTGRES_DB ${LOCAL_PATH}/application/database/.env | cut -d '=' -f2)

BACKUP_FILE="db_backup.sql.gz"

echo "📦 Backing up database..."

ssh -i "$SSH_KEY" ${REMOTE_USER}@${REMOTE_HOST} "
  set -e
  CONTAINER_ID=\$(docker ps -q --filter \"ancestor=shadowself-core-postgres\")
  docker exec -e PGPASSWORD=${DB_PASSWORD} \$CONTAINER_ID \
    pg_dump -U ${DB_USER} -d ${DB_NAME}
" | gzip > "${BACKUP_FILE}"

echo "🎉 Database backup completed and saved to ${BACKUP_FILE}"
