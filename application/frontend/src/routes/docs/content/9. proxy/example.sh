TARGET_URL="https://httpbin.org/ip"
PROXY_URL="https://$PROXY_HOST:$PROXY_PORT"
PROXY_USER="$PROXY_USER:$PROXY_PASS"

curl --proxy "$PROXY_URL" \
	--proxy-user "$PROXY_USER" "$TARGET_URL"
