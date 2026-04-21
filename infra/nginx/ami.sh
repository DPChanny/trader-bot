#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

sudo apt-get install -y --no-install-recommends nginx

sudo truncate -s 0 /etc/nginx/sites-available/default
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t

sudo systemctl enable nginx
sudo systemctl stop nginx || true
