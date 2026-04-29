#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

bash /home/ubuntu/trader-bot/infra/ami/setup.sh

bash /home/ubuntu/trader-bot/infra/redis/install.sh

bash /home/ubuntu/trader-bot/infra/ami/cleanup.sh
