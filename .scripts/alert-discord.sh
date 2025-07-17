#!/bin/bash

# --- CONFIG ---
SHADOWSELF_PATH=$(dirname "$(realpath "$0")")
WEBHOOK_URL=$(grep WEBHOOK_URL "${SHADOWSELF_PATH}/.env" | cut -d '=' -f2)

if [ -z "$WEBHOOK_URL" ]; then
    echo "ERROR: The WEBHOOK_URL environment variable is not set." >&2
    exit 255
fi

# --- EXECUTION ---
echo "🏃 Running health check script..."
bash "$SHADOWSELF_PATH/health-check.sh"
EXIT_CODE=$?

# --- ANALYSIS ---
if [ $EXIT_CODE -eq 0 ]; then
  echo "🎉 Health check passed successfully. No alert needed."
  exit 0
fi

echo "😮‍💨 Health check FAILED with exit code: $EXIT_CODE"

case $EXIT_CODE in
  1)
    TITLE="🧭 DNS Resolution Failed"
    DESCRIPTION="The script could not resolve the main domain or one of its subdomains. This indicates a critical DNS configuration issue or network problem."
    ;;
  2)
    TITLE="🔌 Port Scan Mismatch"
    DESCRIPTION="One or more expected ports were closed, or an unexpected port was found open. This could be a firewall issue or a service that has crashed."
    ;;
  3)
    TITLE="🌐 HTTP Status Error"
    DESCRIPTION="The web server responded with a non-success (not 2xx) HTTP status code. The web service may be down, misconfigured, or overloaded."
    ;;
  4)
    TITLE="🔒 Invalid TLS Certificate"
    DESCRIPTION="The TLS (SSL) certificate for the domain is invalid, expired, or untrusted. This will cause security warnings for all visitors."
    ;;
  5)
    TITLE="🔑 API Authentication Failure"
    DESCRIPTION="The API endpoint did not return the expected response when queried with the API token. The API service might be down or the token invalid."
    ;;
  6)
    TITLE="📧 Email Handshake Failed"
    DESCRIPTION="The server failed to complete a basic SMTP handshake with an external mail server. This points to a problem with the mail server configuration or outbound port 25 being blocked."
    ;;
  7)
    TITLE="🕵️ Proxy Connection Failed"
    DESCRIPTION="The script could not route traffic through the configured proxy server. The proxy service may be down or misconfigured."
    ;;
  8)
    TITLE="⚡ Website Too Slow"
    DESCRIPTION="The website's total response time exceeded the configured threshold. This indicates a performance issue with the server or application."
    ;;
  *)
    TITLE="🚨 Unknown Error"
    DESCRIPTION="An unexpected error occurred. The health check script exited with a code that is not explicitly handled by the alerter."
    ;;
esac

TIMESTAMP=$(date -u --iso-8601=seconds)

JSON_PAYLOAD=$(printf '{
  "embeds": [{
    "title": "%s",
    "description": "%s",
    "color": 15158332,
    "footer": { "text": "shadowSelf Health Monitoring" },
    "timestamp": "%s"
  }]
}' "$TITLE" "$DESCRIPTION" "$TIMESTAMP")

curl -sS -X POST -H "Content-Type: application/json" -d "$JSON_PAYLOAD" "$WEBHOOK_URL"
echo "✈️ Alert sent to Discord"
