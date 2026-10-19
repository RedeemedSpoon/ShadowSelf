#!/bin/sh
set -eu

certificate="/etc/letsencrypt/live/$APP_HOST/fullchain.pem"
configuration=/etc/nginx/generated/nginx-bootstrap.conf

if [ -s "$certificate" ]; then
  configuration=/etc/nginx/generated/nginx.conf
fi

cp "$configuration" /etc/nginx/nginx.conf
nginx -t

(
  previous=$(stat -c %Y "$certificate" 2>/dev/null || true)

  while sleep 30; do
    current=$(stat -c %Y "$certificate" 2>/dev/null || true)

    if [ -n "$current" ] && [ "$current" != "$previous" ]; then
      cp /etc/nginx/generated/nginx.conf /etc/nginx/nginx.conf

      if nginx -t; then
        nginx -s reload
        previous=$current
      fi
    fi
  done
) &

exec nginx -g 'daemon off;'
