#!/usr/bin/env bash
set -euo pipefail

scripts_dir=$(dirname "$(realpath "$0")")
source "$scripts_dir/environment.sh"

project_dir=$(dirname "$scripts_dir")
output_dir=${1:-"$project_dir"}
mode=${2:---production}

if [[ "$mode" != --production && "$mode" != --development ]]; then
  fail 'Usage: bash .scripts/pack-extension.sh [OUTPUT_DIRECTORY] [--production|--development]'
fi

load_environment

origin=http://localhost:5000
development=true

if [[ "$mode" == --production ]]; then
  validate_application_origin
  origin=${environment[APP_ORIGIN]}
  development=false
fi

package_dir=$(mktemp -d)
trap 'rm -rf -- "$package_dir"' EXIT

mkdir -p -- "$output_dir"
output_dir=$(realpath -- "$output_dir")

for variant in chrome firefox; do
  stage="$package_dir/$variant"

  mkdir -p "$stage"
  cp -R "$project_dir/extension/." "$stage/"
  find "$stage" -type d -empty -delete

  cp "$stage/manifest-$variant.json" "$stage/manifest.json"
  rm "$stage/manifest-chrome.json" "$stage/manifest-firefox.json"

  jq \
    --arg origin "$origin" \
    --argjson development "$development" \
    '.homepage_url = $origin | .host_permissions = [$origin + "/*"] |
      if $development then .version = "0.0.0" | .name = "ShadowSelf Development" else . end' \
    "$stage/manifest.json" > "$stage/manifest.json.tmp"

  mv -- "$stage/manifest.json.tmp" "$stage/manifest.json"

  browser_name=Chromium

  if [[ "$variant" == firefox ]]; then
    browser_name=Firefox
  fi

  archive="$output_dir/ShadowSelf-$browser_name.zip"
  rm -f -- "$archive"

  (
    cd "$stage"

    zip -qr "$archive" .
  )

  unzip -p "$archive" manifest.json >/dev/null

  if unzip -Z1 "$archive" | grep -Eq '(^/|(^|/)\.\./|manifest-(chrome|firefox)\.json)'; then
    exit 1
  fi

  echo "Packaged $archive"
done
