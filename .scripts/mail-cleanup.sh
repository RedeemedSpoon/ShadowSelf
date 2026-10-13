#!/usr/bin/env bash
set -euo pipefail
umask 077

container=${SHADOWSELF_DB_CONTAINER:?Set SHADOWSELF_DB_CONTAINER}
pending_deletions='SELECT identity_id, email FROM identity_deletions WHERE NOT mail_done AND completed_at IS NULL'

rows=$(
  docker exec "$container" sh -c \
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "$1"' \
    sh "$pending_deletions"
)

while IFS='|' read -r identity email; do
  if [[ -z "$identity" ]]; then
    continue
  fi

  if [[ ! "$identity" =~ ^[a-f0-9]{12}$ ]]; then
    exit 1
  fi

  if [[ -n "$email" ]]; then
    if [[ ! "$email" =~ ^[a-zA-Z0-9._+-]+@shadowself\.io$ ]]; then
      exit 1
    fi

    if [[ "${email%@*}" == . || "${email%@*}" == .. ]]; then
      exit 1
    fi

    if [[ -L /var/vmail || -L /var/vmail/shadowself.io ]]; then
      exit 1
    fi

    mailbox="/var/vmail/shadowself.io/${email%@*}"

    if [[ -L "$mailbox" ]]; then
      exit 1
    fi

    rm -rf -- "$mailbox"
  fi

  mark_mail_done="UPDATE identity_deletions SET mail_done = true WHERE identity_id = '$identity'"

  docker exec "$container" sh -c \
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "$1"' \
    sh "$mark_mail_done"
done <<< "$rows"
