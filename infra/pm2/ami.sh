#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

sudo npm install -g pm2
sudo install -d -m 755 -o ubuntu -g ubuntu /home/ubuntu/.pm2

sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo systemctl disable pm2-ubuntu
sudo systemctl stop pm2-ubuntu || true
