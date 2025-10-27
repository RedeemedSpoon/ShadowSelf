#!/bin/bash
set -e

echo "Starting SSL certificate synchronization..."

REMOTE_HOST="root@shadowself.io";
REMOTE_CERT_DIR="/etc/letsencrypt/live/shadowself.io"
LOCAL_CERT_DESTINATIONS=( "application/.certs" "proxies/nginx/.certs" "proxies/squid/.certs")
SHADOWSELF_PATH=$(dirname "$(dirname "$(realpath "$0")")")

echo "Fetching certificates from remote server: $REMOTE_HOST"
scp "$REMOTE_HOST:$REMOTE_CERT_DIR/privkey.pem" .
scp "$REMOTE_HOST:$REMOTE_CERT_DIR/fullchain.pem" .

echo "Distributing certificates to local destinations..."
for destination in "${LOCAL_CERT_DESTINATIONS[@]}"; do
  echo "Copying to $destination"
  cp privkey.pem "$SHADOWSELF_PATH/$destination"
  cp fullchain.pem "$SHADOWSELF_PATH/$destination"
  sleep 0.5
done

echo "Cleaning up temporary certificate files..."
rm privkey.pem fullchain.pem
sleep 0.5

echo "Certificate sync process completed successfully."
