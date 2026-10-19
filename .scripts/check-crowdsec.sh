#!/usr/bin/env bash
set -euo pipefail

collections=(
  crowdsecurity/linux
  crowdsecurity/postfix
  crowdsecurity/dovecot
)

systemctl is-active --quiet crowdsec crowdsec-firewall-bouncer

for collection in "${collections[@]}"; do
  cscli collections inspect "$collection" >/dev/null
done

cscli parsers inspect shadowself/http-metadata >/dev/null

cscli metrics show acquisition parsers scenarios
cscli bouncers list
cscli decisions list

echo 'HTTP logs contain request metadata only; HTTP events do not produce client IP bans. Verify SSH and mail enforcement from an isolated external probe.'
