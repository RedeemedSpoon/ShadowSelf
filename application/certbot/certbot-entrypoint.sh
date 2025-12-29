#!/bin/sh

set -e
trap exit TERM;

until certbot certonly --webroot -w /var/www/certbot --email contact@shadowself.io --agree-tos --no-eff-email --non-interactive \
  -d shadowself.io \
  -d www.shadowself.io \
  -d mail.shadowself.io \
  -d us.shadowself.io \
  -d ca.shadowself.io \
  -d gb.shadowself.io; do
  echo "Certbot failed, retrying in 5 minutes...";
  sleep 300;
done

while :; do
  certbot renew --quiet;
  sleep 12h & wait ${!};
done
