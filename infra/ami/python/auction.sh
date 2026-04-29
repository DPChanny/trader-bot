#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

bash /home/ubuntu/trader-bot/infra/ami/setup.sh
bash /home/ubuntu/trader-bot/infra/ami/python/setup.sh

install -d -m 755 -o ubuntu -g ubuntu /var/log/trader-bot/auction

bash /home/ubuntu/trader-bot/infra/ami/cleanup.sh
