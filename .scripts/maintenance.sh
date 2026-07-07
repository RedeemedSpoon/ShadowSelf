#!/bin/bash
set -e

SHADOWSELF_PATH=$(dirname "$(realpath "$0")")
LOG_FILE="$SHADOWSELF_PATH/maintenance.log"
CRON_JOB="0 3 * * * $SHADOWSELF_PATH/maintenance.sh"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
}

if [[ "$(id -u)" -ne 0 ]]; then
    echo "Run maintenance as root" >&2
    exit 1
fi

touch "$LOG_FILE"
ALL_CRON_JOBS=$(crontab -l 2>/dev/null || true)

log "Maintenance started"

if ! grep -qF "$CRON_JOB" <<< "$ALL_CRON_JOBS"; then
    log "Configuring cron job"
    (printf "%s\n" "$ALL_CRON_JOBS"; printf "%s\n" "$CRON_JOB") | crontab -
fi

export DEBIAN_FRONTEND=noninteractive

log "Updating package list"
apt-get update -y >> "$LOG_FILE" 2>&1

log "Upgrading packages"
apt-get upgrade -y >> "$LOG_FILE" 2>&1

log "Removing unnecessary packages"
apt-get autoremove -y >> "$LOG_FILE" 2>&1

log "Cleaning package cache"
apt-get clean >> "$LOG_FILE" 2>&1

if [[ -f /var/run/reboot-required ]]; then
    log "Reboot required"
fi

log "Maintenance finished"
