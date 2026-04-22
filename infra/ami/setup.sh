#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

apt-get update
apt-get install -y --no-install-recommends git curl

rm -rf /home/ubuntu/trader-bot
git clone https://github.com/DPChanny/trader-bot /home/ubuntu/trader-bot
chown -R ubuntu:ubuntu /home/ubuntu/trader-bot

bash /home/ubuntu/trader-bot/infra/cloudwatch/ami.sh
