#!/usr/bin/env bash
set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
	echo "Run as root"
	exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y --no-install-recommends nginx

truncate -s 0 /etc/nginx/sites-available/default
rm -f /etc/nginx/sites-enabled/default

nginx -t

systemctl enable nginx
systemctl stop nginx || true
