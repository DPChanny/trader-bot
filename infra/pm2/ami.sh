#!/usr/bin/env bash
set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
	echo "Run as root"
	exit 1
fi

export DEBIAN_FRONTEND=noninteractive

npm install -g pm2
install -d -m 755 -o ubuntu -g ubuntu /home/ubuntu/.pm2

pm2 startup systemd -u ubuntu --hp /home/ubuntu
systemctl enable pm2-ubuntu
systemctl stop pm2-ubuntu || true
