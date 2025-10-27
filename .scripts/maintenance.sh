#!/bin/bash

SHADOWSELF_PATH=$(dirname "$(realpath "$0")")

if [ ! -f "$SHADOWSELF_PATH/maintenance.log" ]; then
  touch "$SHADOWSELF_PATH/maintenance.log"
fi

LOG_FILE="$SHADOWSELF_PATH/maintenance.log"
CRON_JOB="0 3 * * * $SHADOWSELF_PATH/maintenance.sh"
ALL_CRON_JOB=$(crontab -l 2>/dev/null)

echo "---------- Maintenance script started at: $(date) ----------" >> $LOG_FILE

if ! echo "$ALL_CRON_JOB" | grep -qF "$CRON_JOB"; then
  echo "Configuring cron job..." >> $LOG_FILE
  (echo "$CRON_JOB"; echo "$ALL_CRON_JOB") | crontab -
fi

echo "#1 Updating package list..." >> $LOG_FILE
apt-get update -y >> $LOG_FILE 2>&1

echo "#2 Upgrading packages..." >> $LOG_FILE
apt-get upgrade -y >> $LOG_FILE 2>&1

echo "#3 Removing unnecessary packages..." >> $LOG_FILE
apt-get autoremove -y >> $LOG_FILE 2>&1

echo "#4 Cleaning up package cache..." >> $LOG_FILE
apt-get clean >> $LOG_FILE 2>&1

echo "Update finished at: $(date)" >> $LOG_FILE
