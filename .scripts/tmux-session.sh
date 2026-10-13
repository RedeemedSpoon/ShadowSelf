#!/usr/bin/env bash
set -euo pipefail

session=ShadowSelf
scripts_dir=$(dirname "$(realpath "$0")")
project_dir=$(dirname "$scripts_dir")

if tmux has-session -t "$session" 2>/dev/null; then
  exec tmux attach-session -t "$session"
fi

frontend_pane=$(
  tmux new-session \
    -d \
    -P \
    -F '#{pane_id}' \
    -s "$session" \
    -n Servers \
    -c "$project_dir/application/frontend"
)

backend_pane=$(
  tmux split-window \
    -P \
    -F '#{pane_id}' \
    -t "$frontend_pane" \
    -h \
    -c "$project_dir/application/backend"
)

tmux new-window \
  -t "$session" \
  -n Workplace \
  -c "$project_dir"

tmux send-keys -t "$frontend_pane" 'bun dev' Enter
tmux send-keys -t "$backend_pane" 'bun dev' Enter

tmux attach-session -t "$session"
