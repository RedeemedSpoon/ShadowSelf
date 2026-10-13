#!/usr/bin/env bash
set -euo pipefail
umask 077

remote=${SHADOWSELF_SSH_TARGET:?Set SHADOWSELF_SSH_TARGET}
container=${SHADOWSELF_DB_CONTAINER:?Set SHADOWSELF_DB_CONTAINER}
backup=${1:-db_backup.dump}

if [[ "$remote" == -* ]]; then
  exit 1
fi

if [[ ! "$container" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  exit 1
fi

if [[ -e "$backup" ]]; then
  echo 'Backup already exists' >&2
  exit 1
fi

ssh_options=(-o BatchMode=yes)

if [[ -n "${SSH_KEY:-}" ]]; then
  ssh_options+=(-i "$SSH_KEY")
fi

partial=$(mktemp "${backup}.XXXXXX")
trap 'rm -f -- "$partial"' EXIT

printf -v remote_command 'docker exec %s sh -c %q' \
  "$container" \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc'

ssh "${ssh_options[@]}" "$remote" "$remote_command" > "$partial"
pg_restore --list "$partial" >/dev/null

mv "$partial" "$backup"
chmod 600 "$backup"

echo "Backup written to $backup"
