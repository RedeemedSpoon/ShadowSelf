#!/bin/bash

session="Shadowself"

window=1
tmux new-session -d -s $session -n 'Server'
tmux send-keys -t $session:$window 'cd $SHADOWSELF_PATH/application/frontend' C-m
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'bun dev' C-m
sleep 0.5

tmux split-window -t $session:1 -h
tmux send-keys -t $session:$window 'cd $SHADOWSELF_PATH/application/backend' C-m
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'bun dev' C-m
sleep 0.5

tmux split-window -t $session:1 -v
tmux send-keys -t $session:$window 'cd $SHADOWSELF_PATH/proxies/src' C-m
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'bun dev' C-m
sleep 0.5

window=2
tmux new-window -t $session:$window -n 'Webhooks'
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'stripe listen --forward-to localhost/webhook-stripe' C-m

tmux split-window -t $session:2 -v
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'twilio phone-numbers:update $PHONE_NUMBER --sms-url="http://localhost/webhook-twilio"' C-m

window=3
tmux new-window -t $session:$window -n 'Database'
tmux send-keys -t $session:$window 'cd $SHADOWSELF_PATH/application/database' C-m
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'psql postgresql://$DB_USER:$DB_USER_PWD@localhost:5432/$DB_NAME' C-m

window=4
tmux new-window -t $session:$window -n 'Code'
tmux send-keys -t $session:$window 'cd $SHADOWSELF_PATH' C-m;
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'onefetch' C-m
sleep 0.5


tmux attach-session -t $session
