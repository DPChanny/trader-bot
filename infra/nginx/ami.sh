#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

sudo apt-get update
sudo apt-get install -y --no-install-recommends nginx

sudo truncate -s 0 /etc/nginx/sites-available/default
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t

sudo systemctl enable nginx
sudo systemctl stop nginx || true
