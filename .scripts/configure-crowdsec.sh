#!/usr/bin/env bash
set -euo pipefail
umask 077

scripts_dir=$(dirname "$(realpath "${BASH_SOURCE[0]}")")
source_dir="$scripts_dir/../application/microservices/crowdsec"
backup=
applied=false
configured=false
ipv6_restricted=false
units=(shadowself-http-ipv6.service shadowself-security-logrotate.timer)
declare -A unit_enabled unit_active
files=(
  /etc/crowdsec/acquis.d/shadowself-nginx.yaml
  /etc/crowdsec/parsers/s01-parse/shadowself-http.yaml
  /etc/logrotate.d/shadowself-nginx
  /etc/systemd/system/shadowself-security-logrotate.service
  /etc/systemd/system/shadowself-security-logrotate.timer
  /usr/local/sbin/shadowself-http-ipv6.sh
  /etc/systemd/system/shadowself-http-ipv6.service
)

cleanup() {
  local index destination unit

  set +e

  if [[ "$configured" == true && "$applied" == false ]]; then
    for unit in "${units[@]}"; do
      if [[ "${unit_active[$unit]}" == false ]]; then
        systemctl stop "$unit"
      fi

      if [[ "${unit_enabled[$unit]}" == false ]]; then
        systemctl disable "$unit"
      fi
    done

    if [[ "$ipv6_restricted" == false ]]; then
      if "$scripts_dir/http-ipv6-firewall.sh" --check >/dev/null 2>&1; then
        ip6tables --wait --delete INPUT ! --in-interface lo --protocol tcp \
          --match multiport --destination-ports 80,443 --jump REJECT --reject-with tcp-reset
      fi
    fi

    for index in "${!files[@]}"; do
      destination=${files[index]}

      if [[ -f "$backup/$index" ]]; then
        cp -p -- "$backup/$index" "$destination"
      elif [[ -f "$backup/$index.absent" ]]; then
        rm -f -- "$destination"
      fi
    done

    systemctl daemon-reload

    for unit in "${units[@]}"; do
      if [[ "${unit_active[$unit]}" == true ]]; then
        systemctl start "$unit"
      fi
    done

    systemctl restart crowdsec
  fi

  if [[ -n "$backup" ]]; then
    rm -rf -- "$backup"
  fi
}

if [[ "$EUID" != 0 ]]; then
  printf '%s\n' 'Run as root on the application host.' >&2
  exit 1
fi

"$scripts_dir/check-crowdsec.sh" --prerequisites

for unit in "${units[@]}"; do
  unit_enabled[$unit]=false
  unit_active[$unit]=false

  if systemctl is-enabled --quiet "$unit"; then
    unit_enabled[$unit]=true
  fi

  if systemctl is-active --quiet "$unit"; then
    unit_active[$unit]=true
  fi
done

if "$scripts_dir/http-ipv6-firewall.sh" --check >/dev/null 2>&1; then
  ipv6_restricted=true
fi

backup=$(mktemp -d)
trap cleanup EXIT

for index in "${!files[@]}"; do
  destination=${files[index]}

  if [[ -f "$destination" ]]; then
    cp -p -- "$destination" "$backup/$index"
  else
    touch "$backup/$index.absent"
  fi
done

configured=true

install -d -m 0750 /var/log/shadowself/nginx
install -m 0644 "$source_dir/parsers/s01-parse/shadowself-http.yaml" "${files[1]}"
awk '/^---$/ { exit } { print }' "$source_dir/acquis.yaml" > "${files[0]}"
chmod 0644 "${files[0]}"
install -m 0644 "$source_dir/nginx-logrotate" "${files[2]}"

touch /var/log/shadowself/nginx/security.log
chmod 0640 /var/log/shadowself/nginx/security.log

cat > "${files[3]}" <<'UNIT'
[Unit]
Description=Rotate minimal HTTP security events

[Service]
Type=oneshot
ExecStart=/usr/sbin/logrotate /etc/logrotate.d/shadowself-nginx
ExecStartPost=/usr/bin/find /var/log/shadowself/nginx -maxdepth 1 -type f -name security.log.* -mmin +1440 -delete
UNIT

cat > "${files[4]}" <<'UNIT'
[Unit]
Description=Check HTTP security log retention hourly

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
UNIT

install -m 0755 "$scripts_dir/http-ipv6-firewall.sh" "${files[5]}"

cat > "${files[6]}" <<'UNIT'
[Unit]
Description=Restrict public HTTP to source-preserving IPv4 ingress
Before=docker.service crowdsec-firewall-bouncer.service

[Service]
Type=oneshot
ExecStart=/usr/local/sbin/shadowself-http-ipv6.sh
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
UNIT

crowdsec -t
logrotate --debug /etc/logrotate.d/shadowself-nginx

systemctl daemon-reload
systemctl restart crowdsec
systemctl enable --now shadowself-http-ipv6.service
"$scripts_dir/check-crowdsec.sh"
systemctl enable --now shadowself-security-logrotate.timer

applied=true
printf '%s\n' \
  'HTTP security detection configured.' \
  'Apply and validate the matching Nginx configuration before reloading it.'
