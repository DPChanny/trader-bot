#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

apt-get install -y --no-install-recommends nginx

systemctl disable nginx
systemctl stop nginx || true

rm -f /etc/nginx/sites-available/* || true
rm -f /etc/nginx/sites-enabled/* || true
