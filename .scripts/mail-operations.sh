#!/usr/bin/env bash
set -euo pipefail
umask 077

scripts_dir=$(dirname "$(realpath "$0")")
source "$scripts_dir/deployment.sh"

if [[ $# -ne 1 || "$1" != domain && "$1" != provision ]]; then
  fail 'Usage: bash .scripts/mail-operations.sh [domain|provision]'
fi

load_environment
validate_deployment

if [[ "$1" == domain ]]; then
  printf '%s\n' "${environment[MAIL_DOMAIN]}"
  exit 0
fi

mailboxes=(contact verification)
passwords=("${environment[EMAIL_CONTACT]-}" "${environment[EMAIL_VERIFICATION]-}")
rows=()

for index in "${!mailboxes[@]}"; do
  password=${passwords[index]}

  if [[ ${#password} -lt 24 || "${password,,}" =~ replace-with|placeholder|change.?me|synthetic ]]; then
    fail 'Configure independent random official-mailbox passwords of at least 24 characters'
  fi

  hash=$(printf '%s' "$password" | openssl dgst -sha256 -binary | openssl base64 -A)
  rows+=("('${mailboxes[index]}@${environment[MAIL_DOMAIN]}', '$hash')")
done

values=$(
  IFS=,
  printf '%s' "${rows[*]}"
)

query="INSERT INTO service_mailboxes (email, password) VALUES $values"
query+=' ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password;'

if ! printf '%s\n' "$query" |
  docker compose \
    --project-directory "$application_dir" \
    exec -T postgres sh -c \
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' \
    >/dev/null 2>&1; then
  fail 'Official-mailbox provisioning failed'
fi

printf '%s\n' 'Official mailboxes provisioned. Passwords were not printed.'
