#!/usr/bin/env bash
set -euo pipefail
umask 077

mode=${1:---dry-run}
[[ "$mode" == --dry-run || "$mode" == --apply ]] || exit 1
: "${POSTGRES_DB:?Set POSTGRES_DB}"
: "${MAIL_DB_PASSWORD:?Set MAIL_DB_PASSWORD}"
: "${SHADOWSELF_TLS_CERT:?Set SHADOWSELF_TLS_CERT}"
: "${SHADOWSELF_TLS_KEY:?Set SHADOWSELF_TLS_KEY}"
[[ "$POSTGRES_DB" =~ ^[a-zA-Z_][a-zA-Z0-9_]*$ && "$MAIL_DB_PASSWORD" =~ ^[a-fA-F0-9]{48,128}$ ]] || exit 1
for path in "$SHADOWSELF_TLS_CERT" "$SHADOWSELF_TLS_KEY"; do
  [[ "$path" =~ ^/[a-zA-Z0-9_./-]+$ && -f "$path" ]] || exit 1
done
project_dir=$(dirname "$(dirname "$(realpath "$0")")")
stage=$(mktemp -d)
trap 'rm -rf -- "$stage"' EXIT
export POSTGRES_DB MAIL_DB_PASSWORD SHADOWSELF_TLS_CERT SHADOWSELF_TLS_KEY
python3 - "$project_dir/application/mail" "$stage" <<'PY'
from pathlib import Path
import os
import sys
source, stage = map(Path, sys.argv[1:])
replacements = {'SHADOWSELF_DATABASE': os.environ['POSTGRES_DB'], 'SHADOWSELF_MAIL_DB_PASSWORD': os.environ['MAIL_DB_PASSWORD'], 'SHADOWSELF_TLS_CERT': os.environ['SHADOWSELF_TLS_CERT'], 'SHADOWSELF_TLS_KEY': os.environ['SHADOWSELF_TLS_KEY']}
for path in source.iterdir():
    content = path.read_text()
    for key, value in replacements.items():
        content = content.replace(key, value)
    (stage / path.name).write_text(content)
mailboxes = (stage / 'postfix-pgsql.cf').read_text()
(stage / 'postfix-senders.cf').write_text(mailboxes[:mailboxes.index('query =')] + "query = SELECT email FROM mailboxes WHERE email = '%s'\n")
PY
if [[ "$mode" == --dry-run ]]; then
  echo 'Mail configuration rendered. Apply only on a fresh Debian 12 mail host with Postfix and Dovecot 2.3.'
  exit 0
fi
[[ "$EUID" == 0 ]] || exit 1
command -v postconf >/dev/null
command -v doveconf >/dev/null
[[ $(dovecot --version) == 2.3.* ]] || { echo 'This configuration requires Dovecot 2.3' >&2; exit 1; }
[[ ! -e /etc/postfix/shadowself-mailboxes.cf && ! -e /etc/dovecot/shadowself-sql.conf.ext ]] || { echo 'Mail configuration already installed' >&2; exit 1; }
if ! getent passwd vmail >/dev/null; then
  ! getent passwd 5000 >/dev/null
  ! getent group 5000 >/dev/null
  groupadd --gid 5000 vmail
  useradd --uid 5000 --gid 5000 --home-dir /var/vmail --shell /usr/sbin/nologin vmail
fi
[[ $(id -u vmail) == 5000 && $(id -g vmail) == 5000 ]] || exit 1
install -d -m 0700 -o vmail -g vmail /var/vmail /var/vmail/shadowself.io
backup=$(mktemp -d /root/shadowself-mail-backup.XXXXXX)
cp -a /etc/postfix /etc/dovecot "$backup/"
rollback() {
  rm -f /etc/postfix/shadowself-mailboxes.cf /etc/postfix/shadowself-senders.cf /etc/dovecot/shadowself-sql.conf.ext
  cp -a "$backup/postfix/." /etc/postfix/
  cp -a "$backup/dovecot/." /etc/dovecot/
  systemctl restart postfix dovecot
}
trap 'status=$?; rollback; exit "$status"' ERR
install -m 0640 -o root -g postfix "$stage/postfix-pgsql.cf" /etc/postfix/shadowself-mailboxes.cf
install -m 0640 -o root -g postfix "$stage/postfix-senders.cf" /etc/postfix/shadowself-senders.cf
install -m 0600 "$stage/dovecot-sql.conf.ext" /etc/dovecot/shadowself-sql.conf.ext
install -m 0644 "$stage/dovecot.conf" /etc/dovecot/dovecot.conf
install -m 0644 "$stage/postfix-main.cf" /etc/postfix/main.cf
postconf -M 'submission/inet=submission inet n - y - - smtpd'
postconf -M 'submissions/inet=submissions inet n - y - - smtpd'
postconf -P 'submission/inet/smtpd_tls_security_level=encrypt' 'submission/inet/smtpd_sasl_auth_enable=yes' 'submission/inet/smtpd_client_restrictions=permit_sasl_authenticated,reject' 'submission/inet/smtpd_sender_login_maps=pgsql:/etc/postfix/shadowself-senders.cf' 'submission/inet/smtpd_sender_restrictions=reject_authenticated_sender_login_mismatch'
postconf -P 'submissions/inet/smtpd_tls_wrappermode=yes' 'submissions/inet/smtpd_sasl_auth_enable=yes' 'submissions/inet/smtpd_client_restrictions=permit_sasl_authenticated,reject' 'submissions/inet/smtpd_sender_login_maps=pgsql:/etc/postfix/shadowself-senders.cf' 'submissions/inet/smtpd_sender_restrictions=reject_authenticated_sender_login_mismatch'
doveconf -n >/dev/null
postfix check
systemctl restart dovecot postfix
systemctl is-active --quiet dovecot postfix
trap - ERR
echo "Mail services configured. Recovery configuration: $backup"
