#!/bin/bash

session="shadowself"

tmux new-session -d -s $session -n 'server'

window=0
tmux send-keys -t $session:$window 'cd ~/Code/ShadowSelf/Frontend' C-m
tmux send-keys -t $session:$window 'bun dev' C-m

tmux split-window -t $session:0 -h
tmux send-keys -t $session:$window 'cd ~/Code/ShadowSelf/Backend' C-m
tmux send-keys -t $session:$window 'bun dev' C-m

window=1
tmux new-window -t $session:$window -n 'database'
tmux send-keys -t $session:$window 'cd ~/Code/ShadowSelf/Backend' C-m
tmux send-keys -t $session:$window 'psql postgresql://$DB_USERNAME:$DB_PASSWORD@localhost:5432/$DB_SERVER' C-m

window=2
tmux new-window -t $session:$window -n 'code'
tmux send-keys -t $session:$window 'cd ~/Code/ShadowSelf' C-m;

sleep 0.5
tmux send-keys -t $session:$window 'clear' C-m

tmux attach-session -t $session
