#!/bin/bash

if [ -z "$PROXY_HOST" ] || [ -z "$PROXY_PORT" ] || [ -z "$PROXY_USER" ] || [ -z "$PROXY_PASS" ]; then
  echo "Error: PROXY_HOST, PROXY_PORT, PROXY_USER, and PROXY_PASS env vars must be set." >&2
  exit 1
fi

TARGET_URL="https://httpbin.org/ip"
PROXY_URL="https://$PROXY_USER:$PROXY_PASS@$PROXY_HOST:$PROXY_PORT"

echo "Making request to $TARGET_URL via proxy $PROXY_HOST..."

curl -L \
     --proxy "$PROXY_URL" \
     --proxy-insecure \
     "$TARGET_URL"

echo ""
