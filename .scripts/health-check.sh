#!/bin/bash

## --- ENVIRONMENT --- ##
if [[ -z "$SHADOWSELF_PROXY_USERNAME" || -z "$SHADOWSELF_PROXY_PASSWORD" || -z "$SHADOWSELF_API_TOKEN" ]]; then
  echo "Error: Environment variables SHADOWSELF_PROXY_USERNAME, SHADOWSELF_PROXY_PASSWORD, and SHADOWSELF_API_TOKEN are required."
  exit 1
fi

## --- CONFIGURATION --- ##
PROXY_USERNAME=${SHADOWSELF_PROXY_USERNAME}
PROXY_PASSWORD=${SHADOWSELF_PROXY_PASSWORD}
API_TOKEN=${SHADOWSELF_API_TOKEN}

TARGET_DOMAIN="shadowself.io"
SUBDOMAINS=("mail" "us" "gb" "ca" "se")
API_ENDPOINT="https://shadowself.io/api/test"
PROXY_SERVER="https://${PROXY_USERNAME}:${PROXY_PASSWORD}@us.shadowself.io:3128"
EMAIL_ADDRESS="healthcheck@shadowself.io"
TEST_ADDRESS="test@mxtoolbox.com"

## --- SCRIPT SETUP --- ##
SPEED_THRESHOLD="2.0"
EXPECTED_PORTS=("22/tcp" "25/tcp" "80/tcp" "143/tcp" "443/tcp" "587/tcp" "993/tcp")

GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m"

function fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    exit $2
}

function success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    sleep 0.5
}

function header() {
    echo -e "\n${YELLOW}--- $1 ---${NC}"
    sleep 0.25
}

## --- SCRIPT START --- ##
echo "========================================="
echo "  System Health Check Initializing...    "
echo "  Target: $TARGET_DOMAIN"
echo "========================================="


# 1. DNS Resolution (Main Domain + Subdomains)
header "1. 🧭 DNS Resolution Check"
echo "Checking main domain: $TARGET_DOMAIN"

host "$TARGET_DOMAIN" > /dev/null 2>&1
if [[ $? -ne 0 ]]; then
    fail "DNS resolution failed for main domain: $TARGET_DOMAIN" 1
fi
success "Main domain resolves correctly."

for sub in "${SUBDOMAINS[@]}"; do
    echo "Checking subdomain: $sub"
    host "$sub.$TARGET_DOMAIN" > /dev/null 2>&1
    if [[ $? -ne 0 ]]; then
        fail "DNS resolution failed for subdomain: $sub" 1
    fi
    success "Subdomain '$sub' resolves correctly."
done


# 2. Port Scan (Strict Check)
header "2. 🔌 Port Accessibility Check"
echo "Scanning $TARGET_DOMAIN for open TCP ports. This may take a moment..."

FOUND_PORTS=$(nmap -sT --open "$TARGET_DOMAIN" 2>/dev/null | grep '/tcp' | awk '{print $1}' | sort -V | paste -sd ' ')
EXPECTED_PORTS_SORTED=$(printf "%s\n" "${EXPECTED_PORTS[@]}" | sort -V | paste -sd ' ')

echo "Expected open ports: $EXPECTED_PORTS_SORTED"
echo "Found open ports:    $FOUND_PORTS"

if [[ "$FOUND_PORTS" != "$EXPECTED_PORTS_SORTED" ]]; then
    fail "Port scan mismatch. Expected '$EXPECTED_PORTS_SORTED' but found '$FOUND_PORTS'." 2
fi
success "All expected ports are open, and no unexpected ports were found."


# 3. HTTP Status (OK Status)
header "3. 🌐 HTTP Status Check"
echo "Checking for a 2xx success status from https://$TARGET_DOMAIN"

http_status=$(curl -s -o /dev/null -w "%{http_code}" "https://$TARGET_DOMAIN")
if [[ "$http_status" -lt 200 || "$http_status" -ge 400 ]]; then
    fail "Received a non-success HTTP status code: $http_status" 3
fi
success "Received HTTP status code: $http_status"


# 4. TLS Certificate (Valid Cert)
header "4. 🔒 TLS Certificate Validity"
echo "Verifying TLS certificate for https://$TARGET_DOMAIN using openssl..."

openssl_output=$(echo | openssl s_client -servername "$TARGET_DOMAIN" -connect "$TARGET_DOMAIN":443 2>&1)
echo "$openssl_output" | grep -q "Verify return code: 0 (ok)"

if [[ $? -ne 0 ]]; then
    error_reason=$(echo "$openssl_output" | grep "Verify return code")
    fail "TLS certificate is INVALID. Reason: ${error_reason:-Connection failed or timed out.}" 4
fi
success "TLS certificate is valid and trusted."


# 5. API Authentication (Custom Response)
header "5. 🔑 API Authentication and Response"
echo "Testing authenticated endpoint: $API_ENDPOINT"

api_response=$(curl -s -H "Authorization: Bearer $API_TOKEN" "$API_ENDPOINT")
expected_response="Authentication is working ;)"

if [[ "$api_response" != "$expected_response" ]]; then
    fail "API response did not match expected text. Received: '$api_response'" 5
fi
success "API returned the correct authentication message."


# 6. Email (Basic Handshake)
header "6. 📧 Email Deliverability Handshake Test"
echo "Testing connection to an external email server ($TEST_ADDRESS)..."

swaks --to "$TEST_ADDRESS" \
      --from "$EMAIL_ADDRESS" \
      --quit-after RCPT > /dev/null 2>&1

if [[ $? -ne 0 ]]; then
    fail "Could not complete an SMTP handshake with an external server." 6
fi
success "Successfully completed SMTP handshake with an external server."


# 7. Proxy Connection (Connectivity Test)
header "7. 🕵️ Proxy Connectivity Test"
echo "Checking connection to the internet via proxy: $PROXY_SERVER"

curl -s --proxy "$PROXY_SERVER" --head https://www.example.com > /dev/null
if [[ $? -ne 0 ]]; then
    fail "Could not connect to the internet via the proxy server." 7
fi
success "Proxy server is routing traffic correctly."


# 8. Speed (Response Time)
header "8. ⚡ Website Speed Test"
echo "Measuring total response time for https://$TARGET_DOMAIN"

response_time=$(curl -s -o /dev/null -w "%{time_total}" "https://$TARGET_DOMAIN")
if (( $(echo "$response_time > $SPEED_THRESHOLD" | bc -l) )); then
    fail "Response time ($response_time s) exceeded threshold of $SPEED_THRESHOLD s." 8
fi
success "Response time is within limits ($response_time s)."


# --- ALL TESTS PASSED ---
echo -e "\n${GREEN}=============================================="
echo -e " 🎉 All health checks passed successfully! 🎉"
echo -e "==============================================${NC}"
exit 0
