#!/usr/bin/env bash
set -euo pipefail

scripts_dir=$(dirname "$(realpath "${BASH_SOURCE[0]}")")
application_dir=$(realpath "$scripts_dir/../application")
environment_file="$application_dir/.env"

declare -A environment=()
declare -A environment_line_numbers=()
declare -a environment_lines=()

fail() {
  printf '%s\n' "$*" >&2
  exit 1
}

read_quoted_environment_value() {
  local quote=${environment_value:0:1}
  local remainder=${environment_value:1}
  local offset character previous='' trailing
  local trailing_pattern='^[[:space:]]*(#.*)?$'

  environment_value=''

  while true; do
    for ((offset = 0; offset < ${#remainder}; offset++)); do
      character=${remainder:offset:1}

      if [[ "$character" == "$quote" && "$previous" != '\' ]]; then
        trailing=${remainder:offset+1}

        if [[ ! "$trailing" =~ $trailing_pattern ]]; then
          fail "Unexpected text after a quoted environment value on line $((environment_index + 1))"
        fi

        if [[ "$quote" == '"' ]]; then
          environment_value=${environment_value//\\n/$'\n'}
          environment_value=${environment_value//\\r/$'\r'}
        fi

        return
      fi

      environment_value+=$character

      if [[ "$character" == '\' && "$previous" != '\' ]]; then
        previous='\'
      else
        previous=''
      fi
    done

    environment_index=$((environment_index + 1))

    if ((environment_index >= ${#environment_lines[@]})); then
      fail 'Unterminated quoted environment value'
    fi

    environment_value+=$'\n'
    remainder=${environment_lines[environment_index]%$'\r'}
  done
}

load_environment() {
  local assignment_pattern='^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=(.*)$'
  local line key start

  mapfile -t environment_lines < "$environment_file"
  environment=()
  environment_line_numbers=()

  for ((environment_index = 0; environment_index < ${#environment_lines[@]}; environment_index++)); do
    line=${environment_lines[environment_index]%$'\r'}

    if [[ "$line" =~ ^[[:space:]]*(#.*)?$ ]]; then
      continue
    fi

    if [[ ! "$line" =~ $assignment_pattern ]]; then
      fail "Invalid environment assignment on line $((environment_index + 1))"
    fi

    key=${BASH_REMATCH[2]}
    environment_value=${BASH_REMATCH[3]}
    environment_value=${environment_value#"${environment_value%%[![:space:]]*}"}
    start=$environment_index

    case "${environment_value:0:1}" in
      "'"|'"'|'`')
        read_quoted_environment_value
        ;;
      *)
        environment_value=${environment_value%%#*}
        environment_value=${environment_value%"${environment_value##*[![:space:]]}"}
        ;;
    esac

    if [[ -v environment_line_numbers[$key] ]]; then
      start=-1
    fi

    environment[$key]=$environment_value
    environment_line_numbers[$key]=$start
  done
}

valid_domain() {
  local domain=$1 label
  local -a labels

  if [[ ${#domain} -gt 253 || ! "$domain" =~ ^[a-z0-9.-]+$ || ! "$domain" =~ \.[a-z]{2,63}$ ]]; then
    return 1
  fi

  IFS=. read -r -a labels <<< "$domain"

  for label in "${labels[@]}"; do
    if [[ ${#label} -gt 63 || ! "$label" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
      return 1
    fi
  done
}

validate_application_origin() {
  local origin=${environment[APP_ORIGIN]-}
  local origin_pattern='^https://([a-z0-9.-]+)(:([1-9][0-9]{0,4}))?$'
  local port

  if [[ ! "$origin" =~ $origin_pattern ]]; then
    fail 'APP_ORIGIN must be an exact HTTPS origin'
  fi

  app_host=${BASH_REMATCH[1]}
  port=${BASH_REMATCH[3]-}

  if [[ -n "$port" ]]; then
    if ((port > 65535 || port == 443)); then
      fail 'APP_ORIGIN contains a noncanonical or invalid port'
    fi
  fi

  if ! valid_domain "$app_host"; then
    fail 'APP_ORIGIN must contain an exact lowercase DNS name'
  fi
}

