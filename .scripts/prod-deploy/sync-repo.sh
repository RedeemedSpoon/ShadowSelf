#!/bin/bash
set -euo pipefail

SSH_USER="root"
REMOTE_HOST="shadowself.io"
SERVER_PATH="/root/ShadowSelf"
COMPOSE_FILE="application/compose.yaml"

SSH_OPTIONS=(-i "$SSH_KEY")
SERVER="${SSH_USER}@${REMOTE_HOST}"

echo "Deploying ShadowSelf on ${REMOTE_HOST}..."

echo "Pulling latest changes..."
ssh "${SSH_OPTIONS[@]}" "$SERVER" "cd '$SERVER_PATH' && git pull --ff-only"

echo "Restarting application stack..."
ssh "${SSH_OPTIONS[@]}" "$SERVER" "cd '$SERVER_PATH' && docker compose -f '$COMPOSE_FILE' down --remove-orphans"
ssh "${SSH_OPTIONS[@]}" "$SERVER" "cd '$SERVER_PATH' && docker compose -f '$COMPOSE_FILE' up -d --build"
ssh "${SSH_OPTIONS[@]}" "$SERVER" "docker image prune -f >/dev/null"
ssh "${SSH_OPTIONS[@]}" "$SERVER" "cd '$SERVER_PATH' && docker compose -f '$COMPOSE_FILE' ps"

echo "Deploy completed."
