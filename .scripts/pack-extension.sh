#!/usr/bin/env bash
set -euo pipefail

scripts_dir=$(dirname "$(realpath "$0")")
project_dir=$(dirname "$scripts_dir")
output_dir=${1:-"$project_dir"}
mode=${2:---production}

if [[ "$mode" != --production && "$mode" != --development ]]; then
  exit 1
fi

package_dir=$(mktemp -d)
trap 'rm -rf -- "$package_dir"' EXIT

mkdir -p "$output_dir"
output_dir=$(realpath "$output_dir")

for variant in chrome firefox; do
  stage="$package_dir/$variant"

  mkdir -p "$stage"
  cp -R "$project_dir/extension/." "$stage/"
  find "$stage" -type d -empty -delete

  cp "$stage/manifest-$variant.json" "$stage/manifest.json"
  rm "$stage/manifest-chrome.json" "$stage/manifest-firefox.json"

  if [[ "$mode" == --development ]]; then
    bun -e '
      const file = Bun.file(process.argv[1]);
      const manifest = await file.json();

      manifest.version = "0.0.0";
      manifest.name = "ShadowSelf Development";
      manifest.host_permissions = ["http://localhost:5000/*"];

      await Bun.write(file, JSON.stringify(manifest, null, 2));
    ' "$stage/manifest.json"
  fi

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
