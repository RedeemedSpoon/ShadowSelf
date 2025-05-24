#!/bin/bash
set -e

SSH_USER="root"
DOMAIN="shadowself.io"
SUBDOMAINS=("us" "ca" "gb" "se")

RSYNC_EXCLUDES=(
    --exclude 'bun.lockb'
    --exclude 'package-lock.json'
    --exclude 'pnpm-lock.yaml'
    --exclude 'Thumbs.db'
    --exclude '.DS_Store'
    --exclude 'build/'
    --exclude 'node_modules/'
    --exclude '.svelte-kit/'
)

update_server() {
    local server_address="$1"
    local component_path="$2"
    local local_path="${SHADOWSELF_PATH}/${component_path}"
    echo "Updating ${server_address}..."

    rsync -a --delete "${RSYNC_EXCLUDES[@]}" \
        "${local_path}/" \
        "$SSH_USER@$server_address:\$SHADOWSELF_PATH/${component_path}/" > /dev/null 2>&1

    ssh "$SSH_USER@$server_address" "
        set -e;
        cd \"\$SHADOWSELF_PATH/${component_path}\";
        docker-compose down;
        docker-compose build --build-arg SUBDOMAIN=${server_address};
        docker-compose up -d --remove-orphans;
    " > /dev/null 2>&1
}

update_server "$DOMAIN" "application"

for subdomain in "${SUBDOMAINS[@]}"; do
    proxy_server="${subdomain}.${DOMAIN}"
    update_server "$proxy_server" "proxies"
done
