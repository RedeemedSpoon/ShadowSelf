#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "No SQL command provided"
  exit 1
fi

REMOTE_USER="root"
REMOTE_HOST="shadowself.io"
SHADOWSELF_PATH=$(dirname "$(dirname "$(realpath "$0")")")
SAFE_SQL_COMMAND=$(printf "%q" "$1")

DB_USER=$(grep POSTGRES_USER ${SHADOWSELF_PATH}/application/database/.env | cut -d '=' -f2)
DB_PASSWORD=$(grep POSTGRES_PASSWORD ${SHADOWSELF_PATH}/application/database/.env | cut -d '=' -f2)
DB_NAME=$(grep POSTGRES_DB ${SHADOWSELF_PATH}/application/database/.env | cut -d '=' -f2)

ssh -i "$SSH_KEY" ${REMOTE_USER}@${REMOTE_HOST} "
  set -e
  CONTAINER_ID=\$(docker ps -q --filter \"ancestor=shadowself-core-postgres\")
  docker exec -e PGPASSWORD=${DB_PASSWORD} \$CONTAINER_ID \
    psql -U ${DB_USER} -d ${DB_NAME} -c ${SAFE_SQL_COMMAND}
"
