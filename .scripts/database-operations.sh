#!/usr/bin/env bash
set -euo pipefail
umask 077

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

operation=${1:-}
input=${2:-}

if [[ $# -gt 2 || "$operation" != backup && "$operation" != query ]]; then
  fail 'Usage: bash .scripts/database-operations.sh [backup [FILE]|query SQL]'
fi

if [[ "$operation" == query && -z "${input//[[:space:]]/}" ]]; then
  fail 'Provide a SQL query'
fi

remote_command='set -eu
container=$(docker ps \
  --filter label=com.docker.compose.project=shadowself \
  --filter label=com.docker.compose.service=postgres \
  --format "{{.ID}}")

case "$container" in
  ""|*[!a-f0-9]*)
    printf "%s\n" "Expected exactly one running ShadowSelf PostgreSQL container" >&2
    exit 1
    ;;
esac
'

if [[ "$operation" == query ]]; then
  query_command='psql -X -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"'
  remote_command+="docker exec -i \"\$container\" sh -c '$query_command'"

  printf '%s\n' "$input" | ssh -o BatchMode=yes root@shadowself.io "$remote_command"
  exit 0
fi

destination=${input:-db_backup.dump}

if [[ -e "$destination" || -L "$destination" ]]; then
  fail 'Backup already exists'
fi

temporary=$(mktemp -- "$destination.XXXXXX")
trap 'rm -f -- "$temporary"' EXIT

dump_command='pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc'
remote_command+="docker exec \"\$container\" sh -c '$dump_command'"

ssh -o BatchMode=yes root@shadowself.io "$remote_command" > "$temporary"
pg_restore --list "$temporary" >/dev/null

ln -- "$temporary" "$destination"

printf 'Backup written to %s\n' "$destination"
