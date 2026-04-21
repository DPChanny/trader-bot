#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

bash /var/www/trader-bot/infra/ami/python/setup.sh
bash /var/www/trader-bot/infra/ami/kill.sh
