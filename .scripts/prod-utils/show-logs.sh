#!/bin/bash
set -euo pipefail

SSH_USER="root"
REMOTE_HOST="shadowself.io"
SERVER_PATH="/root/ShadowSelf"
COMPOSE_FILE="${SERVER_PATH}/application/compose.yaml"
SERVICE="${1:-}"
TAIL_LINES="${TAIL_LINES:-150}"

SSH_OPTIONS=(-i "$SSH_KEY")
SERVER="${SSH_USER}@${REMOTE_HOST}"

case "$SERVICE" in
    "" | nginx | certbot | postgres | backend | frontend) ;;
    *)
        echo "Usage: $0 [nginx|certbot|postgres|backend|frontend]" >&2
        exit 1
        ;;
esac

if [[ -z "$SERVICE" ]]; then
    ssh "${SSH_OPTIONS[@]}" "$SERVER" "docker compose -f '$COMPOSE_FILE' logs -f --tail '$TAIL_LINES'"
else
    ssh "${SSH_OPTIONS[@]}" "$SERVER" "docker compose -f '$COMPOSE_FILE' logs -f --tail '$TAIL_LINES' '$SERVICE'"
fi
