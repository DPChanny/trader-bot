#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

bash /home/ubuntu/trader-bot/infra/ami/setup.sh

sudo apt-get install -y --no-install-recommends redis-server
sudo systemctl disable redis-server
sudo systemctl stop redis-server || true

bash /home/ubuntu/trader-bot/infra/ami/kill.sh
