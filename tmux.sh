#!/bin/bash

session="shadowself"

window=1
tmux new-session -d -s $session -n 'server'
tmux send-keys -t $session:$window 'cd ~/Code/ShadowSelf/Frontend' C-m
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'bun dev' C-m
sleep 0.5

tmux split-window -t $session:1 -h
tmux send-keys -t $session:$window 'cd ~/Code/ShadowSelf/Backend' C-m
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'bun dev' C-m
sleep 0.5

window=2
tmux new-window -t $session:$window -n 'database'
tmux send-keys -t $session:$window 'cd ~/Code/ShadowSelf/Backend' C-m
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'psql postgresql://$DB_USERNAME:$DB_PASSWORD@localhost:5432/$DB_SERVER' C-m

window=3
tmux new-window -t $session:$window -n 'production'
tmux send-keys -t $session:$window 'ssh $HOST' C-m;
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'neofetch' C-m

window=4
tmux new-window -t $session:$window -n 'code'
tmux send-keys -t $session:$window 'cd ~/Code/ShadowSelf' C-m;
tmux send-keys -t $session:$window 'clear' C-m
sleep 0.5

tmux attach-session -t $session
