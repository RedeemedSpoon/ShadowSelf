#!/usr/bin/env bash
set -euo pipefail

scripts_dir=$(dirname "$(realpath "$0")")
application_dir="$scripts_dir/../application"
lock_file=/run/lock/shadowself-maintenance.lock

exec 9>"$lock_file"

if ! flock -n 9; then
  exit 0
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get upgrade -y

apt-get autoremove -y
apt-get clean

if systemctl is-active --quiet docker; then
  (
    cd "$application_dir"

    bash ../.scripts/deployment.sh render
    docker compose up -d --remove-orphans
  )
fi
