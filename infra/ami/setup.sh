#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

sudo apt-get update
sudo apt-get install -y --no-install-recommends \
	curl \
	git \
	lsof \
	htop

sudo rm -rf /home/ubuntu/trader-bot
git clone https://github.com/DPChanny/trader-bot /home/ubuntu/trader-bot
sudo chown -R ubuntu:ubuntu /home/ubuntu/trader-bot

bash /home/ubuntu/trader-bot/infra/cloudwatch/ami.sh
