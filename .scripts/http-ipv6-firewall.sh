#!/usr/bin/env bash
set -euo pipefail

rule=(
  INPUT
  ! --in-interface lo
  --protocol tcp
  --match multiport
  --destination-ports 80,443
  --jump REJECT
  --reject-with tcp-reset
)

if [[ "${1:-}" == --check ]]; then
  ip6tables --wait --check "${rule[@]}"
  exit 0
fi

if [[ $# != 0 ]]; then
  printf '%s\n' 'Usage: http-ipv6-firewall.sh [--check]' >&2
  exit 1
fi

if ! ip6tables --wait --check "${rule[@]}" 2>/dev/null; then
  ip6tables --wait --insert "${rule[@]}"
fi
