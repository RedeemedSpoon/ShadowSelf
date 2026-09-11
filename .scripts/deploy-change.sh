#!/usr/bin/env bash
set -euo pipefail
umask 077

remote=${SHADOWSELF_SSH_TARGET:?Set SHADOWSELF_SSH_TARGET}
remote_dir=${SHADOWSELF_REMOTE_PATH:?Set SHADOWSELF_REMOTE_PATH}
component=${SHADOWSELF_COMPONENT:-application}
[[ "$remote_dir" =~ ^/[a-zA-Z0-9_./-]+$ && "$component" =~ ^(application|proxies)$ ]] || exit 1
project_dir=$(dirname "$(dirname "$(realpath "$0")")")
mode=${1:---dry-run}
[[ "$mode" == --apply || "$mode" == --dry-run ]] || exit 1
ssh_options=(-o BatchMode=yes)
[[ -z "${SSH_KEY:-}" ]] || ssh_options+=(-i "$SSH_KEY")

ssh "${ssh_options[@]}" "$remote" "command -v docker >/dev/null && test -d '$remote_dir/$component'"
rsync_options=(-a --delete --itemize-changes --exclude .env --exclude '*.lock' --exclude bun.lockb --exclude node_modules --exclude build --exclude .svelte-kit --exclude server --exclude '*.temporary.*')
[[ "$mode" == --apply ]] || rsync_options+=(--dry-run)
if [[ "$mode" == --apply ]]; then
  ssh "${ssh_options[@]}" "$remote" "cd '$remote_dir' && tar -czf '$component.rollback.tar.gz' --exclude=node_modules --exclude=build --exclude=.svelte-kit '$component'"
fi
rsync "${rsync_options[@]}" "$project_dir/$component/" "$remote:$remote_dir/$component/"
[[ "$mode" == --apply ]] || exit 0

ssh "${ssh_options[@]}" "$remote" bash -s -- "$remote_dir" "$component" <<'REMOTE'
set -euo pipefail
root=$1
component=$2
cd "$root/$component"
docker compose config --quiet
mapfile -t images < <(docker compose config --images)
docker image save "${images[@]}" -o "$root/$component.images.rollback.tar"
docker compose build
if ! docker compose up -d --wait --wait-timeout 180; then
  cd "$root"
  tar -xzf "$component.rollback.tar.gz"
  docker image load -i "$component.images.rollback.tar"
  cd "$component"
  docker compose up -d --wait --wait-timeout 180
  exit 1
fi
REMOTE
