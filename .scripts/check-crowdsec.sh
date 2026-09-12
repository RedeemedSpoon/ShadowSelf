#!/usr/bin/env bash
set -euo pipefail

systemctl is-active --quiet crowdsec crowdsec-firewall-bouncer
for collection in crowdsecurity/linux crowdsecurity/nginx crowdsecurity/postfix crowdsecurity/dovecot; do
  cscli collections inspect "$collection" >/dev/null
done
cscli metrics show acquisition parsers scenarios
cscli bouncers list
cscli decisions list
echo 'Inspect acquisition counters and the firewall bouncer last-pull timestamp. Confirm packet enforcement from an isolated external probe before release.'
