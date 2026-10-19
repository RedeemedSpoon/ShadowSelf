#!/bin/sh
set -eu

trap 'exit 0' TERM INT

set --
previous_ifs=$IFS
IFS=,

for domain in $APP_DOMAINS,$MAIL_HOST; do
  set -- "$@" -d "$domain"
done

IFS=$previous_ifs

until certbot certonly \
  --webroot \
  -w /var/www/certbot \
  --cert-name "$APP_HOST" \
  --email "$ACME_EMAIL" \
  --agree-tos \
  --non-interactive \
  --renew-with-new-domains \
  "$@"; do
  echo 'Certificate issuance failed; retrying in five minutes.'
  sleep 300 &
  wait "$!"
done

while :; do
  certbot renew --quiet
  sleep 12h &
  wait "$!"
done
