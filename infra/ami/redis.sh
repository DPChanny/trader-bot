#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

bash /var/www/trader-bot/infra/ami/setup.sh

sudo apt-get install -y --no-install-recommends redis-server
sudo systemctl enable redis-server
sudo systemctl stop redis-server || true

bash /var/www/trader-bot/infra/ami/kill.sh
