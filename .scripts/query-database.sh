#!/usr/bin/env bash
set -euo pipefail

remote=${SHADOWSELF_SSH_TARGET:?Set SHADOWSELF_SSH_TARGET}
container=${SHADOWSELF_DB_CONTAINER:?Set SHADOWSELF_DB_CONTAINER}

if [[ "$remote" == -* || ! "$container" =~ ^[a-zA-Z0-9_-]+$ ]]; then
  exit 1
fi

if [[ $# -ne 1 || -z "$1" ]]; then
  echo 'Usage: query-database.sh SQL' >&2
  exit 1
fi

ssh_options=(-o BatchMode=yes)

if [[ -n "${SSH_KEY:-}" ]]; then
  ssh_options+=(-i "$SSH_KEY")
fi

printf -v remote_command 'docker exec -i %s sh -c %q' \
  "$container" \
  'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

printf '%s\n' "$1" | ssh "${ssh_options[@]}" "$remote" "$remote_command"
