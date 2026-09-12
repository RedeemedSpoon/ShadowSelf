#!/usr/bin/env bash
set -euo pipefail
umask 077

origin=${SHADOWSELF_HEALTH_ORIGIN:?Set SHADOWSELF_HEALTH_ORIGIN to the environment to check}
backend=${SHADOWSELF_HEALTH_BACKEND:?Set SHADOWSELF_HEALTH_BACKEND to its internal backend URL}
[[ "$origin" =~ ^https://[a-zA-Z0-9.-]+(:[0-9]+)?$ ]] || exit 1
[[ "$backend" =~ ^https?://[a-zA-Z0-9.-]+(:[0-9]+)?$ ]] || exit 1

for url in "$origin/" "$backend/health/live" "$backend/health/billing"; do
  curl --fail --silent --show-error --connect-timeout 5 --max-time 20 --output /dev/null "$url"
  echo "Healthy: $url"
done

if [[ -n "${SHADOWSELF_API_TOKEN:-}" ]]; then
  [[ "$SHADOWSELF_API_TOKEN" =~ ^[a-zA-Z0-9_-]+$ ]] || exit 1
  response=$(printf 'header = "Authorization: Bearer %s"\n' "$SHADOWSELF_API_TOKEN" | curl --config - --fail --silent --show-error --connect-timeout 5 --max-time 20 "$origin/api/test")
  [[ "$response" == 'Authentication is working ;)' ]] || exit 1
  echo 'API authentication passed'
fi

echo 'HTTP, TLS and backend readiness passed. Mail delivery, proxy authentication and firewall enforcement require their separate acceptance checks.'
