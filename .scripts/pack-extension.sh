#!/usr/bin/env bash
set -euo pipefail

project_dir=$(dirname "$(dirname "$(realpath "$0")")")
output_dir=${1:-"$project_dir"}
package_dir=$(mktemp -d)
trap 'rm -rf -- "$package_dir"' EXIT
mkdir -p "$output_dir"
output_dir=$(realpath "$output_dir")

for variant in chrome firefox; do
  stage="$package_dir/$variant"
  mkdir -p "$stage"
  cp -R "$project_dir/extension/." "$stage/"
  cp "$stage/manifest-$variant.json" "$stage/manifest.json"
  rm "$stage/manifest-chrome.json" "$stage/manifest-firefox.json"
  name=Chromium
  [[ "$variant" != firefox ]] || name=Firefox
  archive="$output_dir/ShadowSelf-$name.zip"
  rm -f -- "$archive"
  (cd "$stage" && zip -qr "$archive" .)
  unzip -p "$archive" manifest.json >/dev/null
  if unzip -Z1 "$archive" | grep -Eq '(^/|(^|/)\.\./|manifest-(chrome|firefox)\.json)'; then
    exit 1
  fi
  echo "Packaged $archive"
done
