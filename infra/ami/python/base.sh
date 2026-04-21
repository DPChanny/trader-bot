#!/usr/bin/env bash
set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
	echo "Run as root"
	exit 1
fi

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/../base.sh"

apt-get install -y --no-install-recommends \
	nodejs \
	npm

install -d -m 755 -o ubuntu -g ubuntu /var/www
rm -rf /var/www/trader-bot
sudo -u ubuntu -H git clone https://github.com/DPChanny/trader-bot /var/www/trader-bot

