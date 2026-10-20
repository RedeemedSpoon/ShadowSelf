#!/usr/bin/env bash
set -euo pipefail

collections=(
  crowdsecurity/linux
  crowdsecurity/nginx
  crowdsecurity/postfix
  crowdsecurity/dovecot
)

systemctl is-active --quiet crowdsec crowdsec-firewall-bouncer

for collection in "${collections[@]}"; do
  cscli collections inspect "$collection" >/dev/null
done

for firewall in iptables ip6tables; do
  "$firewall" --check INPUT --jump CROWDSEC_CHAIN
  "$firewall" --check FORWARD --jump DOCKER-USER
  "$firewall" --check DOCKER-USER --jump CROWDSEC_CHAIN
done

if [[ "${1:-}" == --prerequisites ]]; then
  exit 0
fi

if [[ $# != 0 ]]; then
  printf '%s\n' 'Usage: check-crowdsec.sh [--prerequisites]' >&2
  exit 1
fi

scripts_dir=$(dirname "$(realpath "${BASH_SOURCE[0]}")")
"$scripts_dir/http-ipv6-firewall.sh" --check

crowdsec -t

explanation=$(cscli explain \
  --type shadowself-http \
  --log '192.0.2.123 [20/Oct/2026:12:00:00 +0000] "GET /.git/config" 404' \
  --only-successful-parsers \
  --verbose \
  --color no)

if [[ "$explanation" != *shadowself/http-security* || "$explanation" != *crowdsecurity/http-sensitive-files* ]]; then
  printf '%s\n' 'HTTP security events did not reach the expected parser and scenario.' >&2
  exit 1
fi

cscli metrics show acquisition parsers scenarios
cscli bouncers list

printf '%s\n' \
  'HTTP security parsing, IPv4 Docker forwarding hooks, and public IPv6 HTTP restriction verified.' \
  'A ban-and-recovery probe is required to prove packet enforcement.'
