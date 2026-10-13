#!/usr/bin/env bash
set -euo pipefail

scripts_dir=$(dirname "$(realpath "$0")")
project_dir=$(dirname "$scripts_dir")

for workspace in backend frontend; do
  (
    cd "$project_dir/application/$workspace"

    while IFS= read -r test_file; do
      bun test "$test_file"
    done < <(find tests -name '*.test.ts' -type f | sort)
  )
done
