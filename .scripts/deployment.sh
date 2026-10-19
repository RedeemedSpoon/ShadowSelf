#!/usr/bin/env bash
set -euo pipefail
umask 077

scripts_dir=$(dirname "$(realpath "${BASH_SOURCE[0]}")")
source "$scripts_dir/environment.sh"

validate_deployment() {
  local configured=${environment[APP_DOMAINS]-}
  local domain password=${environment[MAIL_DB_PASSWORD]-}
  local -A seen=()
  local -a configured_domains

  validate_application_origin

  if [[
    -z "$configured" || "$configured" == ,* || "$configured" == *, || "$configured" == *,,* ||
    "$configured" == *$'\n'* || "$configured" == *$'\r'*
  ]]; then
    fail 'APP_DOMAINS must contain exact comma-separated DNS names'
  fi

  IFS=, read -r -a configured_domains <<< "$configured"
  domains=()

  for domain in "${configured_domains[@]}"; do
    if ! valid_domain "$domain"; then
      fail 'APP_DOMAINS must contain exact lowercase DNS names'
    fi

    if [[ ! -v seen[$domain] ]]; then
      domains+=("$domain")
      seen[$domain]=1
    fi
  done

  if [[ ! -v seen[$app_host] ]]; then
    fail 'APP_ORIGIN must be listed in APP_DOMAINS'
  fi

  for domain in "${environment[MAIL_DOMAIN]-}" "${environment[MAIL_HOST]-}"; do
    if ! valid_domain "$domain"; then
      fail 'MAIL_DOMAIN and MAIL_HOST must be exact lowercase DNS names'
    fi
  done

  if [[ -n "${environment[ONION_ORIGIN]-}" && ! "${environment[ONION_ORIGIN]}" =~ ^http://[a-z2-7]{56}\.onion$ ]]; then
    fail 'ONION_ORIGIN must be an exact HTTP v3 onion origin'
  fi

  if [[ ! "${environment[POSTGRES_DB]-}" =~ ^[a-zA-Z0-9_]+$ || ! "$password" =~ ^[a-zA-Z0-9_-]{24,}$ ]]; then
    fail 'Configure a database identifier and a random base64url MAIL_DB_PASSWORD of at least 24 characters'
  fi

  if [[ "${password,,}" =~ replace-with|placeholder|change.?me ]]; then
    fail 'MAIL_DB_PASSWORD must be a random credential'
  fi
}

render_template() {
  local template=$1 destination=$2 line token key value rendered
  local -a lines

  mapfile -t lines < "$template"

  for line in "${lines[@]}"; do
    rendered=''

    while [[ "$line" =~ __([A-Z_]+)__ ]]; do
      token=${BASH_REMATCH[0]}
      key=${BASH_REMATCH[1]}
      value=${replacements[$key]-}

      if [[ -z "$value" || "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
        fail "Missing or invalid $key"
      fi

      rendered+=${line%%"$token"*}
      rendered+=$value
      line=${line#*"$token"}
    done

    printf '%s%s\n' "$rendered" "$line"
  done > "$destination"
}

render_deployment() (
  local generated="$application_dir/.generated"
  local stage template destination onion_host=onion-disabled.invalid
  local -A replacements
  local -a templates=(
    nginx.conf
    nginx-bootstrap.conf
    microservices/mail/postfix-main.cf
    microservices/mail/postfix-master.cf
    microservices/mail/postfix-sender-login.cf
    microservices/mail/postfix-pgsql.cf
    microservices/mail/dovecot.conf
    microservices/mail/dovecot-sql.conf.ext
  )

  if [[ -n "${environment[ONION_ORIGIN]-}" ]]; then
    onion_host=${environment[ONION_ORIGIN]#http://}
  fi

  replacements=(
    [APP_HOST]="$app_host"
    [APP_ORIGIN]="${environment[APP_ORIGIN]}"
    [NGINX_DOMAINS]="${domains[*]}"
    [ONION_HOST]="$onion_host"
    [MAIL_HOST]="${environment[MAIL_HOST]}"
    [MAIL_DOMAIN]="${environment[MAIL_DOMAIN]}"
    [CONTACT_EMAIL]="contact@${environment[MAIL_DOMAIN]}"
    [POSTGRES_DB]="${environment[POSTGRES_DB]}"
    [MAIL_DB_PASSWORD]="${environment[MAIL_DB_PASSWORD]}"
    [TLS_CERT]="/etc/letsencrypt/live/$app_host/fullchain.pem"
    [TLS_KEY]="/etc/letsencrypt/live/$app_host/privkey.pem"
  )

  mkdir -p "$generated/mail" "$generated/nginx"
  chmod 700 "$generated" "$generated/mail" "$generated/nginx"

  stage=$(mktemp -d "$generated/.render.XXXXXX")
  trap 'rm -rf -- "$stage"' EXIT

  for template in "${templates[@]}"; do
    destination="$stage/${template##*/}"
    render_template "$application_dir/$template" "$destination"
  done

  printf 'APP_HOST=%s\nACME_EMAIL=%s\n' "$app_host" "${replacements[CONTACT_EMAIL]}" > "$stage/compose.env"

  for template in "${templates[@]}"; do
    destination=nginx

    if [[ "$template" == microservices/* ]]; then
      destination=mail
    fi

    mv -- "$stage/${template##*/}" "$generated/$destination/${template##*/}"
  done

  mv -- "$stage/compose.env" "$generated/compose.env"
)

update_domain_alias() {
  local command=$1 domain=$2 existing found=false
  local -a updated=()

  if [[ -z "$domain" || "$domain" == "$app_host" ]]; then
    fail 'Specify an alias domain; edit APP_ORIGIN directly to change the primary domain'
  fi

  if ! valid_domain "$domain"; then
    fail 'Specify an exact lowercase DNS name'
  fi

  for existing in "${domains[@]}"; do
    if [[ "$existing" == "$domain" ]]; then
      found=true

      if [[ "$command" == remove ]]; then
        continue
      fi
    fi

    updated+=("$existing")
  done

  if [[ "$command" == remove && "$found" == false ]]; then
    fail 'The exact alias is not present in APP_DOMAINS'
  fi

  if [[ "$command" == add && "$found" == false ]]; then
    updated+=("$domain")
  fi

  if [[ "${environment_line_numbers[APP_DOMAINS]}" == -1 ]]; then
    fail 'Define APP_DOMAINS exactly once in application/.env'
  fi

  environment[APP_DOMAINS]=$(
    IFS=,
    printf '%s' "${updated[*]}"
  )
}

main() {
  local command=${1:-render} domain=${2:-} temporary index

  if [[ $# -gt 2 || "$command" != render && "$command" != add && "$command" != remove ]]; then
    fail 'Usage: bash .scripts/deployment.sh [render|add DOMAIN|remove DOMAIN]'
  fi

  if [[ "$command" == render && $# -gt 1 ]]; then
    fail 'The render command does not take a domain'
  fi

  mkdir -p "$application_dir/.generated"
  exec 9>"$application_dir/.generated/deployment.lock"
  flock 9

  load_environment
  validate_deployment

  if [[ "$command" != render ]]; then
    update_domain_alias "$command" "$domain"
    validate_deployment
  fi

  render_deployment

  if [[ "$command" != render ]]; then
    temporary=$(mktemp "$environment_file.XXXXXX")
    trap 'rm -f -- "$temporary"' EXIT

    for index in "${!environment_lines[@]}"; do
      if [[ "$index" == "${environment_line_numbers[APP_DOMAINS]}" ]]; then
        printf 'APP_DOMAINS=%s\n' "${environment[APP_DOMAINS]}"
      else
        printf '%s\n' "${environment_lines[index]}"
      fi
    done > "$temporary"

    mv -- "$temporary" "$environment_file"
    trap - EXIT
  fi

  printf '%s\n' 'Deployment configuration validated and rendered. Rebuild and restart services to apply changes.'
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
