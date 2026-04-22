#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y --no-install-recommends nodejs
sudo npm install -g npm@latest

sudo npm install -g pm2
command -v pm2 >/dev/null

sudo install -d -m 755 -o ubuntu -g ubuntu /home/ubuntu/.pm2

sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
sudo systemctl disable pm2-ubuntu
sudo systemctl stop pm2-ubuntu || true
