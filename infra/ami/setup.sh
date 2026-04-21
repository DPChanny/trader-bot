#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

sudo apt-get update
sudo apt-get install -y --no-install-recommends \
	curl \
	git \
	lsof \
	htop

cd /

sudo install -d -m 755 -o ubuntu -g ubuntu /var/www
sudo rm -rf /var/www/trader-bot
git clone https://github.com/DPChanny/trader-bot /var/www/trader-bot

bash /var/www/trader-bot/infra/cloudwatch/ami.sh
