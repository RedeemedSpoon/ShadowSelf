#!/bin/bash
set -euo pipefail

SSH_USER="root"
REMOTE_HOST="shadowself.io"
SERVER_PATH="/root/ShadowSelf"
SCRIPT_PATH=$(dirname "$(realpath "$0")")
SHADOWSELF_PATH=$(dirname "$(dirname "$SCRIPT_PATH")")

SSH_OPTIONS=(-i "$SSH_KEY")
SERVER="${SSH_USER}@${REMOTE_HOST}"
ENV_FILES=("application/backend/.env" "application/database/.env" "application/frontend/.env")

for file in "${ENV_FILES[@]}"; do
    local_file="${SHADOWSELF_PATH}/${file}"
    remote_file="${SERVER_PATH}/${file}"
    remote_dir=$(dirname "$remote_file")

    if [[ ! -f "$local_file" ]]; then
        echo "Missing ${file}" >&2
        exit 1
    fi

    echo "Syncing ${file}"
    ssh "${SSH_OPTIONS[@]}" "$SERVER" "mkdir -p '$remote_dir'"
    scp "${SSH_OPTIONS[@]}" "$local_file" "${SERVER}:${remote_file}"
    ssh "${SSH_OPTIONS[@]}" "$SERVER" "chmod 600 '$remote_file'"
done

if [[ -d "${SHADOWSELF_PATH}/.onion_keys" ]]; then
    echo "Syncing .onion_keys"
    ssh "${SSH_OPTIONS[@]}" "$SERVER" "mkdir -p '$SERVER_PATH/.onion_keys'"
    scp "${SSH_OPTIONS[@]}" -r "${SHADOWSELF_PATH}/.onion_keys/." "${SERVER}:${SERVER_PATH}/.onion_keys/"
    ssh "${SSH_OPTIONS[@]}" "$SERVER" "chmod -R go-rwx '$SERVER_PATH/.onion_keys'"
fi

echo "Keys synced."
