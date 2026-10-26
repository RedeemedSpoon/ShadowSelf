#!/usr/bin/env bash
set -euo pipefail

project_root="$(realpath "$(dirname "${BASH_SOURCE[0]}")/..")"
review_root="$(dirname "$project_root")/ShadowSelf-purchase-review"

if [[ -e "$review_root" && ! -f "$review_root/.purchase-review-copy" ]]; then
  printf 'Refusing to overwrite an unmarked directory: %s\n' "$review_root" >&2
  exit 1
fi

mkdir -p "$review_root"
touch "$review_root/.purchase-review-copy"

rsync --archive --delete \
  --exclude='.git' \
  --exclude='.env*' \
  --exclude='.svelte-kit' \
  --exclude='.vite' \
  --exclude='.vite-temp' \
  --exclude='/application/frontend/build' \
  --exclude='/application/backend/server' \
  --exclude='.purchase-review-copy' \
  --exclude='.generated' \
  --exclude='.certs' \
  --exclude='.easy-pki' \
  --exclude='.output' \
  --exclude='db_backup.*' \
  --exclude='.onion_keys' \
  --exclude='cache_wallet' \
  --exclude='*.db' \
  --exclude='*.sqlite*' \
  --exclude='*.log' \
  "$project_root/" \
  "$review_root/"

review_settings="$(cat <<'SETTINGS'
PURCHASE_REVIEW=true
FRONTEND_PORT=5001
APP_ORIGIN=http://localhost:5001
MAIL_DOMAIN=example.test
SETTINGS
)"

existing_settings=''

if [[ -f "$review_root/application/.env" ]]; then
  existing_settings="$(< "$review_root/application/.env")"
fi

if [[ "$existing_settings" != "$review_settings" ]]; then
  printf '%s\n' "$review_settings" > "$review_root/application/.env"
fi

printf 'Purchase review copy synchronized: %s\n' "$review_root"
printf 'Run bun review:dev to open the review server on port 5001.\n'
