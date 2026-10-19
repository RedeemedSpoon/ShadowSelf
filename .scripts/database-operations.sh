#!/usr/bin/env bash
set -euo pipefail
umask 077

scripts_dir=$(dirname "$(realpath "$0")")
source "$scripts_dir/environment.sh"

operation=${1:-}
input=${2:-}

if [[ $# -gt 2 || "$operation" != backup && "$operation" != query ]]; then
  fail 'Usage: bash .scripts/database-operations.sh [backup [FILE]|query SQL]'
fi

if [[ "$operation" == query && -z "${input//[[:space:]]/}" ]]; then
  fail 'Provide a SQL query'
fi

load_environment

remote=${environment[SHADOWSELF_SSH_TARGET]-}
container=${environment[SHADOWSELF_DB_CONTAINER]-}
remote_pattern='^([a-zA-Z0-9_.-]+@)?([a-zA-Z0-9_.-]+|\[[a-fA-F0-9:]+\])$'

if [[ ! "$remote" =~ $remote_pattern || "$remote" == -* || ! "$container" =~ ^[a-zA-Z0-9][a-zA-Z0-9_.-]*$ ]]; then
  fail 'Configure SHADOWSELF_SSH_TARGET and SHADOWSELF_DB_CONTAINER in application/.env'
fi

ssh_options=(-o BatchMode=yes)

if [[ -n "${environment[SSH_KEY]-}" ]]; then
  ssh_options+=(-i "${environment[SSH_KEY]}")
fi

if [[ "$operation" == query ]]; then
  printf -v remote_command 'docker exec -i %s sh -c %q' \
    "$container" \
    'psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'

  printf '%s\n' "$input" | ssh "${ssh_options[@]}" "$remote" "$remote_command"
  exit 0
fi

destination=${input:-db_backup.dump}

if [[ -e "$destination" || -L "$destination" ]]; then
  fail 'Backup already exists'
fi

temporary=$(mktemp "$destination.XXXXXX")
trap 'rm -f -- "$temporary"' EXIT

printf -v remote_command 'docker exec %s sh -c %q' \
  "$container" \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc'

ssh "${ssh_options[@]}" "$remote" "$remote_command" > "$temporary"
pg_restore --list "$temporary" >/dev/null

ln -- "$temporary" "$destination"

printf 'Backup written to %s\n' "$destination"
