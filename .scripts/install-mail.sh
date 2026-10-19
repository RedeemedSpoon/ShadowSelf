#!/usr/bin/env bash
set -euo pipefail
umask 077

scripts_dir=$(dirname "$(realpath "$0")")
application_dir="$scripts_dir/../application"

if [[ "$EUID" != 0 ]]; then
  echo 'Run this installer as root after reviewing the generated mail configuration.' >&2
  exit 1
fi

bash "$scripts_dir/deployment.sh" render

if ! getent group vmail >/dev/null; then
  groupadd --gid 5000 vmail
fi

if ! getent passwd vmail >/dev/null; then
  useradd --uid 5000 --gid vmail --home-dir /var/vmail --no-create-home --shell /usr/sbin/nologin vmail
fi

if [[ $(id -u vmail) != 5000 || $(id -g vmail) != 5000 ]]; then
  echo 'The vmail account must have UID and GID 5000.' >&2
  exit 1
fi

install -d -o vmail -g vmail -m 0700 /var/vmail
install -o root -g root -m 0644 "$application_dir/.generated/mail/postfix-main.cf" /etc/postfix/main.cf
install -o root -g root -m 0644 "$application_dir/.generated/mail/postfix-master.cf" /etc/postfix/master.cf
install -o root -g postfix -m 0640 "$application_dir/.generated/mail/postfix-pgsql.cf" /etc/postfix/shadowself-mailboxes.cf
install -o root -g postfix -m 0640 "$application_dir/.generated/mail/postfix-sender-login.cf" /etc/postfix/shadowself-sender-login.cf
install -o root -g root -m 0644 "$application_dir/.generated/mail/dovecot.conf" /etc/dovecot/dovecot.conf
install -o root -g dovecot -m 0640 "$application_dir/.generated/mail/dovecot-sql.conf.ext" /etc/dovecot/shadowself-sql.conf.ext

if ! postfix check >/dev/null 2>&1; then
  echo 'Postfix validation failed. Services were not restarted.' >&2
  exit 1
fi

if ! doveconf -n >/dev/null 2>&1; then
  echo 'Dovecot validation failed. Services were not restarted.' >&2
  exit 1
fi

bash "$scripts_dir/mail-operations.sh" provision
systemctl restart postfix dovecot
