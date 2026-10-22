#!/bin/bash
# Deploys the committed HEAD as the public demo gateway. Run from the repo root:
#   bash gateway/deploy/demo/deploy.sh
set -e
HOST=choco@23.88.32.156
DIR=apps/plexa-demo
git archive --format=tar HEAD | ssh "$HOST" "mkdir -p $DIR && tar -x -C $DIR"
ssh "$HOST" "cd $DIR && cp gateway/deploy/demo/docker-compose.yml gateway/deploy/demo/setup-nginx.sh gateway/deploy/demo/nginx-plexa.ikonetsolutions.com.conf . && docker compose up -d --build && sleep 3 && curl -s http://127.0.0.1:8097/api/health; echo"
