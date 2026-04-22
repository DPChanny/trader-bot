#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

bash /home/ubuntu/trader-bot/infra/ami/setup.sh

apt-get install -y --no-install-recommends redis-server
systemctl disable redis-server
systemctl stop redis-server || true

bash /home/ubuntu/trader-bot/infra/ami/kill.sh
