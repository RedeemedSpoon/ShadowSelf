#!/usr/bin/env bash
set -euo pipefail
umask 077

scripts_dir=$(dirname "$(realpath "$0")")
application_dir="$scripts_dir/../application"
mail_domain=$(bash "$scripts_dir/mail-operations.sh" domain)
mail_root="/var/vmail/$mail_domain"

exec 9>/run/lock/shadowself-mail-cleanup.lock

if ! flock -n 9; then
  exit 0
fi

if [[ -L /var/vmail || -L "$mail_root" ]]; then
  exit 1
fi

if [[ ! -d "$mail_root" ]]; then
  exit 0
fi

doveadm expunge -A mailbox Junk savedbefore 7d

for mailbox in "$mail_root"/*; do
  if [[ ! -d "$mailbox" ]]; then
    continue
  fi

  if [[ -L "$mailbox" ]]; then
    exit 1
  fi

  local_part=${mailbox##*/}

  if [[ ! "$local_part" =~ ^[a-zA-Z0-9._+-]+$ ]]; then
    exit 1
  fi

  lookup="SELECT EXISTS (SELECT 1 FROM identities WHERE email = '$local_part@$mail_domain' UNION ALL SELECT 1 FROM service_mailboxes WHERE email = '$local_part@$mail_domain')"
  exists=$(
    docker compose \
      --project-directory "$application_dir" \
      exec -T postgres sh -c \
      'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -Atc "$1"' \
      sh "$lookup"
  )

  if [[ "$exists" == f ]]; then
    rm -rf -- "$mailbox"
  elif [[ "$exists" != t ]]; then
    exit 1
  fi
done
