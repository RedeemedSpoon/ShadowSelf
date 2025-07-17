#!/bin/bash
set -e

SERVER_PATH="/root/ShadowSelf"
SHADOWSELF_PATH=$(dirname "$(dirname "$(realpath "$0")")")

SSH_USER="root"
DOMAIN="shadowself.io"
SUBDOMAINS=("us" "ca" "gb" "se")
RSYNC_EXCLUDES=(
    --exclude 'bun.lockb'
    --exclude 'package-lock.json'
    --exclude 'pnpm-lock.yaml'
    --exclude 'Thumbs.db'
    --exclude '.DS_Store'
    --exclude 'node_modules/'
    --exclude '.svelte-kit/'
    --exclude 'build/'
)

update_server() {
    local server_address="$1"
    local component_path="$2"
    local local_path="${SHADOWSELF_PATH}/${component_path}"
    echo "🔄 Updating ${server_address}..."

    rsync -a --delete "${RSYNC_EXCLUDES[@]}" "${local_path}/" \
        "$SSH_USER@$server_address:${SERVER_PATH}/${component_path}/"

    echo "📡 Deploying ${server_address}..."
    ssh "$SSH_USER@$server_address" "
        set -e;
        cd \"${SERVER_PATH}/${component_path}\";
        docker compose down;
        docker compose build --build-arg SUBDOMAIN=${server_address};
        docker compose up -d;
    "
}

update_server "$DOMAIN" "application"

for subdomain in "${SUBDOMAINS[@]}"; do
    proxy_server="${subdomain}.${DOMAIN}"
    update_server "$proxy_server" "proxies"
done
