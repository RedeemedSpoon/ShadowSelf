#!/bin/bash

session="ShadowSelf"

SHADOWSELF_PATH=$(dirname "$(dirname "$(realpath "$0")")")
PHONE_NUMBER=$(grep PHONE_NUMBER "${SHADOWSELF_PATH}/.scripts/.env" | cut -d '=' -f2)

DB_USER=$(grep POSTGRES_USER "${SHADOWSELF_PATH}/application/database/.env" | cut -d '=' -f2)
DB_PASSWORD=$(grep POSTGRES_PASSWORD "${SHADOWSELF_PATH}/application/database/.env" | cut -d '=' -f2)
DB_NAME=$(grep POSTGRES_DB "${SHADOWSELF_PATH}/application/database/.env" | cut -d '=' -f2)

window=1
tmux new-session -d -s "$session" -n 'Servers'
tmux send-keys -t "$session:$window" "cd $SHADOWSELF_PATH/application/frontend" C-m
tmux send-keys -t "$session:$window" "clear" C-m
tmux send-keys -t "$session:$window" "bun dev" C-m

tmux split-window -t "$session" -h
tmux send-keys -t "$session:$window" "cd $SHADOWSELF_PATH/application/backend" C-m
tmux send-keys -t "$session:$window" "clear" C-m
tmux send-keys -t "$session:$window" "bun dev" C-m

window=2
tmux new-window -t "$session:$window" -n 'Webhooks'
tmux send-keys -t "$session:$window" "clear" C-m
tmux send-keys -t "$session:$window" "stripe listen --forward-to localhost/webhook-stripe" C-m

tmux split-window -t "$session:$window" -v
tmux send-keys -t "$session:$window" "clear" C-m
tmux send-keys -t "$session:$window" "twilio phone-numbers:update $PHONE_NUMBER --sms-url=http://localhost/webhook-twilio" C-m

window=3
tmux new-window -t "$session:$window" -n 'Database'
tmux send-keys -t "$session:$window" "cd $SHADOWSELF_PATH/application/database" C-m
tmux send-keys -t "$session:$window" "clear" C-m
tmux send-keys -t "$session:$window" "psql postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}" C-m

window=4
tmux new-window -t "$session:$window" -n 'OpenCode'
tmux send-keys -t "$session:$window" "cd $SHADOWSELF_PATH" C-m
tmux send-keys -t "$session:$window" "clear" C-m
tmux send-keys -t "$session:$window" "opencode" C-m

window=5
tmux new-window -t "$session:$window" -n 'Workplace'
tmux send-keys -t "$session:$window" "cd $SHADOWSELF_PATH" C-m
tmux send-keys -t "$session:$window" "clear" C-m
tmux send-keys -t "$session:$window" "onefetch" C-m

sleep 0.5
tmux attach-session -t "$session"
