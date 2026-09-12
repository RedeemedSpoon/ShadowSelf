#!/usr/bin/env bash
set -euo pipefail
umask 077

remote=${SHADOWSELF_SSH_TARGET:?Set SHADOWSELF_SSH_TARGET}
remote_dir=${SHADOWSELF_REMOTE_PATH:?Set SHADOWSELF_REMOTE_PATH}
component=${SHADOWSELF_COMPONENT:-application}
[[ "$remote" != -* && "$remote_dir" =~ ^/[a-zA-Z0-9_./-]+$ && "$component" =~ ^(application|proxies)$ ]] || exit 1
[[ "$remote_dir" != / && "$remote_dir" != *'/../'* ]] || exit 1
project_dir=$(dirname "$(dirname "$(realpath "$0")")")
mode=${1:---dry-run}
[[ "$mode" == --apply || "$mode" == --dry-run ]] || exit 1
command -v rsync >/dev/null
ssh_options=(-o BatchMode=yes)
[[ -z "${SSH_KEY:-}" ]] || ssh_options+=(-i "$SSH_KEY")
printf -v transport '%q ' ssh "${ssh_options[@]}"

ssh "${ssh_options[@]}" "$remote" "command -v docker >/dev/null && command -v rsync >/dev/null && test -d '$remote_dir/$component'"
rsync_options=(-a --delete --itemize-changes -e "$transport" --exclude .env --exclude '*.lock' --exclude bun.lockb --exclude node_modules --exclude build --exclude .svelte-kit --exclude server --exclude proxy --exclude '*.temporary.*')
if [[ "$mode" == --dry-run ]]; then
  rsync "${rsync_options[@]}" --dry-run "$project_dir/$component/" "$remote:$remote_dir/$component/"
  exit 0
fi

ssh "${ssh_options[@]}" "$remote" bash -s -- "$remote_dir" "$component" <<'REMOTE'
set -euo pipefail
umask 077
root=$1
component=$2
cd "$root/$component"
compose=(docker compose)
[[ "$component" != application ]] || compose+=(--env-file frontend/.env)
"${compose[@]}" config --quiet
mapfile -t images < <("${compose[@]}" config --images)
docker image save "${images[@]}" -o "$root/$component.images.rollback.tar"
cd "$root"
tar -czf "$component.rollback.tar.gz" --exclude=node_modules --exclude=build --exclude=.svelte-kit "$component"
REMOTE

rollback() {
  ssh "${ssh_options[@]}" "$remote" bash -s -- "$remote_dir" "$component" <<'REMOTE'
set -euo pipefail
root=$1
component=$2
cd "$root"
failed=$(mktemp -d "$root/failed-deployment.XXXXXX")
mv "$component" "$failed/"
tar -xzf "$component.rollback.tar.gz"
docker image load -i "$component.images.rollback.tar"
cd "$component"
compose=(docker compose)
[[ "$component" != application ]] || compose+=(--env-file frontend/.env)
"${compose[@]}" up -d --force-recreate --wait --wait-timeout 180
REMOTE
}
trap 'status=$?; trap - ERR; rollback || echo "Rollback failed; use the preserved source and image backups" >&2; exit "$status"' ERR
rsync "${rsync_options[@]}" "$project_dir/$component/" "$remote:$remote_dir/$component/"
ssh "${ssh_options[@]}" "$remote" bash -s -- "$remote_dir" "$component" <<'REMOTE'
set -euo pipefail
root=$1
component=$2
cd "$root/$component"
compose=(docker compose)
[[ "$component" != application ]] || compose+=(--env-file frontend/.env)
"${compose[@]}" config --quiet
"${compose[@]}" build
"${compose[@]}" up -d --force-recreate --wait --wait-timeout 180
if [[ "$component" == application ]]; then
  "${compose[@]}" exec -T nginx nginx -t
  "${compose[@]}" exec -T nginx nginx -s reload
fi
REMOTE
trap - ERR
