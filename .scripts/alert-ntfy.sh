#!/bin/bash

# --- CONFIG ---
SHADOWSELF_PATH=$(dirname "$(realpath "$0")")
NTFY_TOPIC=$(grep NTFY_TOPIC "${SHADOWSELF_PATH}/.env" | cut -d '=' -f2)

if [ -z "$NTFY_TOPIC" ]; then
    echo "ERROR: NTFY_TOPIC not found in .env" >&2
    exit 255
fi

# --- EXECUTION ---
echo "Running health check script..."
bash "$SHADOWSELF_PATH/health-check.sh"
EXIT_CODE=$?

# --- ANALYSIS ---
if [ $EXIT_CODE -eq 0 ]; then
  echo "Health check passed. Silence is golden."
  exit 0
fi

echo "Health check FAILED with exit code: $EXIT_CODE"

case $EXIT_CODE in
  1) TITLE="DNS Failure" ;;
  2) TITLE="Port Scan Mismatch" ;;
  3) TITLE="HTTP Error" ;;
  4) TITLE="SSL Invalid" ;;
  5) TITLE="API Auth Fail" ;;
  6) TITLE="SMTP Fail" ;;
  7) TITLE="Proxy Dead" ;;
  8) TITLE="High Latency" ;;
  *) TITLE="Unknown Error ($EXIT_CODE)" ;;
esac

# Description mapping
case $EXIT_CODE in
  1) DESC="Main domain/subdomain not resolving." ;;
  2) DESC="Firewall/Service mismatch." ;;
  3) DESC="Web server returned non-200 status." ;;
  4) DESC="Certificate expired or invalid." ;;
  5) DESC="API endpoint rejected token." ;;
  6) DESC="Mail server handshake failed." ;;
  7) DESC="Proxy routing failed." ;;
  8) DESC="Response time too slow." ;;
  *) DESC="Exit code not handled." ;;
esac

# --- SEND TO NTFY ---
curl \
  -H "Title: 🚨 ShadowSelf: $TITLE" \
  -H "Priority: 5" \
  -H "Tags: skull,warning" \
  -d "$DESC" \
  "https://ntfy.envs.net/$NTFY_TOPIC"

echo "Alert sent to Ntfy topic: $NTFY_TOPIC"
