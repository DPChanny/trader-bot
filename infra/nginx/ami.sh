#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

sudo apt-get install -y --no-install-recommends nginx

sudo nginx -t

sudo systemctl disable nginx
sudo systemctl stop nginx || true

sudo rm -f /etc/nginx/sites-available/* || true
sudo rm -f /etc/nginx/sites-enabled/* || true
