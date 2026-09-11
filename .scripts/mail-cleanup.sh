#!/usr/bin/env bash
set -euo pipefail
umask 077

container=${SHADOWSELF_DB_CONTAINER:?Set SHADOWSELF_DB_CONTAINER}
rows=$(docker exec "$container" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "SELECT identity_id, email FROM identity_deletions WHERE NOT mail_done AND completed_at IS NULL"')
while IFS='|' read -r identity email; do
  [[ -n "$identity" ]] || continue
  [[ "$identity" =~ ^[a-f0-9]{12}$ ]] || exit 1
  if [[ -n "$email" ]]; then
    [[ "$email" =~ ^[a-zA-Z0-9._+-]+@shadowself\.io$ ]] || exit 1
    [[ "${email%@*}" != . && "${email%@*}" != .. ]] || exit 1
    [[ ! -L /var/vmail && ! -L /var/vmail/shadowself.io ]] || exit 1
    mailbox="/var/vmail/shadowself.io/${email%@*}"
    [[ ! -L "$mailbox" ]] || exit 1
    rm -rf -- "$mailbox"
  fi
  docker exec "$container" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "$1"' sh "UPDATE identity_deletions SET mail_done = true WHERE identity_id = '$identity'"
done <<< "$rows"
