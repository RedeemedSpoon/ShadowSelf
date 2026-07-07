#!/bin/bash
set -euo pipefail

REMOTE_USER="root"
REMOTE_HOST="shadowself.io"
SERVER_PATH="/root/ShadowSelf"

SCRIPT_PATH=$(dirname "$(realpath "$0")")
COMPOSE_FILE="${SERVER_PATH}/application/compose.yaml"
BACKUP_NAME="backup-db-$(date +%Y-%m-%d_%H-%M-%S).zip"
TEMP_DIR=$(mktemp -d)

BACKUP_PATH="${SCRIPT_PATH}/${BACKUP_NAME}"
SQL_PATH="${TEMP_DIR}/${BACKUP_NAME%.zip}.sql"

SSH_OPTIONS=(-i "$SSH_KEY")

cleanup() {
    rm -rf "$TEMP_DIR"
}

trap cleanup EXIT

echo "Pulling production database from ${REMOTE_HOST}..."

DUMP_COMMAND='PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

ssh "${SSH_OPTIONS[@]}" "${REMOTE_USER}@${REMOTE_HOST}" \
    "docker compose -f '$COMPOSE_FILE' exec -T postgres sh -c '$DUMP_COMMAND'" > "$SQL_PATH"

zip -q -j "$BACKUP_PATH" "$SQL_PATH"

echo "Database backup saved to ${BACKUP_PATH}"
