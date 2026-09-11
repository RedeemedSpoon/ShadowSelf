#!/usr/bin/env bash
set -euo pipefail
umask 077

remote=${SHADOWSELF_SSH_TARGET:?Set SHADOWSELF_SSH_TARGET}
container=${SHADOWSELF_DB_CONTAINER:?Set SHADOWSELF_DB_CONTAINER}
[[ "$container" =~ ^[a-zA-Z0-9_-]+$ ]] || exit 1
backup=${1:-db_backup.dump}
[[ ! -e "$backup" ]] || { echo 'Backup already exists' >&2; exit 1; }
ssh_options=(-o BatchMode=yes)
[[ -z "${SSH_KEY:-}" ]] || ssh_options+=(-i "$SSH_KEY")
partial=$(mktemp "${backup}.XXXXXX")
trap 'rm -f -- "$partial"' EXIT

ssh "${ssh_options[@]}" "$remote" "docker exec '$container' sh -c 'pg_dump -U \"\$POSTGRES_USER\" -d \"\$POSTGRES_DB\" -Fc'" > "$partial"
pg_restore --list "$partial" >/dev/null
mv "$partial" "$backup"
chmod 600 "$backup"
echo "Backup written to $backup"
