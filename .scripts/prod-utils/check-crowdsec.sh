#!/bin/bash
set -euo pipefail

SSH_USER="${SSH_USER:-root}"
REMOTE_HOST="${REMOTE_HOST:-shadowself.io}"
CROWDSEC_LAPI_PORT="${CROWDSEC_LAPI_PORT:-7600}"
RECENT_LINES="${RECENT_LINES:-80}"

SSH_OPTIONS=(-i "$SSH_KEY")
SERVER="${SSH_USER}@${REMOTE_HOST}"

remote() {
    ssh "${SSH_OPTIONS[@]}" "$SERVER" "$1"
}

section() {
    printf "\n== %s ==\n" "$1"
}

section "CrowdSec Architecture"
printf "Host firewall receives inbound traffic before Docker port forwarding.\n"
printf "CrowdSec reads host and nginx logs, creates decisions, and the firewall bouncer drops banned IPs.\n"
printf "Local API is expected on 127.0.0.1:%s.\n" "$CROWDSEC_LAPI_PORT"

section "Service Health"
remote "systemctl --no-pager --full status crowdsec crowdsec-firewall-bouncer 2>/dev/null | sed -n '1,80p' || true"

section "Local API Listener"
remote "ss -ltnp | grep ':$CROWDSEC_LAPI_PORT ' || true"

section "CrowdSec Version"
remote "crowdsec -version 2>/dev/null || true; cscli version 2>/dev/null || true"

section "Acquisition Sources"
remote "cscli metrics 2>/dev/null | sed -n '/Acquisition Metrics:/,/^$/p' || true"

section "Parser And Scenario Metrics"
remote "cscli metrics 2>/dev/null | sed -n '/Parser Metrics:/,/Local API Metrics:/p' || true"

section "Bouncers"
remote "cscli bouncers list 2>/dev/null || true"

section "Current Banned IPs"
remote "cscli decisions list 2>/dev/null || true"

section "Recent Alerts"
remote "cscli alerts list --limit 25 2>/dev/null || true"

section "Firewall Wiring"
remote "iptables -S INPUT 2>/dev/null | grep -E 'CROWDSEC|crowdsec' || true; iptables -S DOCKER-USER 2>/dev/null | grep -E 'CROWDSEC|crowdsec' || true; iptables -S CROWDSEC_CHAIN 2>/dev/null || true"

section "IP Sets"
remote "ipset list -name 2>/dev/null | grep -E 'crowdsec|CROWDSEC' || true"

section "Recent Service Logs"
remote "journalctl -u crowdsec -u crowdsec-firewall-bouncer -n '$RECENT_LINES' --no-pager 2>/dev/null || true"

section "Manual Bouncer Test"
printf "Run this on the server to verify the firewall path with a harmless documentation IP:\n"
printf "cscli decisions add --ip 192.0.2.123 --duration 2m --reason test-ban\n"
printf "sleep 15\n"
printf "ipset test crowdsec-blacklists-0 192.0.2.123\n"
printf "cscli decisions delete --ip 192.0.2.123\n"
