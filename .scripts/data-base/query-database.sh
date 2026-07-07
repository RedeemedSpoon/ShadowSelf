#!/bin/bash
set -euo pipefail

if [[ $# -eq 0 ]]; then
    echo "No SQL command provided" >&2
    exit 1
fi

REMOTE_USER="root"
REMOTE_HOST="shadowself.io"
SERVER_PATH="/root/ShadowSelf"
COMPOSE_FILE="${SERVER_PATH}/application/compose.yaml"
SQL_COMMAND="$*"

PSQL_COMMAND='PGPASSWORD="$POSTGRES_PASSWORD" psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
SSH_OPTIONS=()

if [[ -n "${SSH_KEY:-}" ]]; then
    SSH_OPTIONS=(-i "$SSH_KEY")
fi

printf "%s\n" "$SQL_COMMAND" | ssh "${SSH_OPTIONS[@]}" "${REMOTE_USER}@${REMOTE_HOST}" \
    "docker compose -f '$COMPOSE_FILE' exec -T postgres sh -c '$PSQL_COMMAND'"
