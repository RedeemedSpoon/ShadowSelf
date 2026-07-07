#!/bin/bash
set -euo pipefail

SSH_USER="root"
REMOTE_HOST="shadowself.io"
SERVER_PATH="/root/ShadowSelf"
COMPOSE_FILE="${SERVER_PATH}/application/compose.yaml"

SSH_OPTIONS=(-i "$SSH_KEY")
SERVER="${SSH_USER}@${REMOTE_HOST}"

remote() {
    ssh "${SSH_OPTIONS[@]}" "$SERVER" "$1"
}

section() {
    printf "\n== %s ==\n" "$1"
}

section "System"
remote "hostname; uptime; uname -sr; printf 'Debian '; cat /etc/debian_version"

section "Resources"
remote "free -h; df -h /; printf '\nLoad\n'; top -bn1 | head -n 5"

section "Repo"
remote "cd '$SERVER_PATH' && git branch --show-current && git log -1 --oneline && git status --short"

section "Compose"
remote "docker compose -f '$COMPOSE_FILE' ps"

section "Containers"
remote "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}'"

section "Disk"
remote "du -sh '$SERVER_PATH' 2>/dev/null; docker system df"
