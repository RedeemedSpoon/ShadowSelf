#!/bin/bash

TARGET_URL="https://httpbin.org/ip"
PROXY_URL="https://$PROXY_USER:$PROXY_PASS@$PROXY_HOST:$PROXY_PORT"

echo "Making request to $TARGET_URL via proxy $PROXY_HOST..."

curl -L \
 --proxy "$PROXY_URL" \
 --proxy-insecure \
 "$TARGET_URL"
