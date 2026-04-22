#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt-get install -y --no-install-recommends nodejs
npm install -g npm@latest

npm install -g pm2
command -v pm2 >/dev/null

install -d -m 755 -o ubuntu -g ubuntu /home/ubuntu/.pm2

pm2 startup systemd -u ubuntu --hp /home/ubuntu
systemctl disable pm2-ubuntu
systemctl stop pm2-ubuntu || true
