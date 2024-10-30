#!/bin/bash

session="Shadowself"

window=1
tmux new-session -d -s $session -n 'Server'
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
tmux new-window -t $session:$window -n 'Database'
tmux send-keys -t $session:$window 'cd ~/Code/ShadowSelf/Backend' C-m
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'psql postgresql://$DB_USER:$DB_USER_PWD@localhost:5432/$DB_NAME' C-m

window=3
tmux new-window -t $session:$window -n 'Production'
tmux send-keys -t $session:$window 'ssh $HOST' C-m;
tmux send-keys -t $session:$window 'clear' C-m
tmux send-keys -t $session:$window 'neofetch' C-m

window=4
tmux new-window -t $session:$window -n 'Code'
tmux send-keys -t $session:$window 'cd ~/Code/ShadowSelf' C-m;
tmux send-keys -t $session:$window 'clear' C-m
sleep 0.5

tmux attach-session -t $session
