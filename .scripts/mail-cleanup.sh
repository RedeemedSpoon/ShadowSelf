#!/usr/bin/env bash
set -euo pipefail
umask 077

container=${SHADOWSELF_DB_CONTAINER:?Set SHADOWSELF_DB_CONTAINER}
mail_root=/var/vmail/shadowself.io

if [[ -L /var/vmail || -L "$mail_root" ]]; then
  exit 1
fi

if [[ ! -d "$mail_root" ]]; then
  exit 0
fi

for mailbox in "$mail_root"/*; do
  if [[ ! -d "$mailbox" ]]; then
    continue
  fi

  if [[ -L "$mailbox" ]]; then
    exit 1
  fi

  local_part=${mailbox##*/}

  if [[ ! "$local_part" =~ ^[a-zA-Z0-9_-]+$ ]]; then
    exit 1
  fi

  lookup="SELECT EXISTS (SELECT 1 FROM identities WHERE email = '$local_part@shadowself.io' UNION ALL SELECT 1 FROM service_mailboxes WHERE email = '$local_part@shadowself.io')"
  exists=$(
    docker exec "$container" sh -c \
      'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -Atc "$1"' \
      sh "$lookup"
  )

  if [[ "$exists" == f ]]; then
    rm -rf -- "$mailbox"
  elif [[ "$exists" != t ]]; then
    exit 1
  fi
done
