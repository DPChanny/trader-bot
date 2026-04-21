#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

sudo apt-get update
sudo apt-get install -y --no-install-recommends \
	curl \
	git \
	jq \
	lsof \
	unzip \
	htop

curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
rm -rf awscliv2.zip ./aws

sudo install -d -m 755 -o ubuntu -g ubuntu /var/www
sudo rm -rf /var/www/trader-bot
git clone https://github.com/DPChanny/trader-bot /var/www/trader-bot

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/../cloudwatch/ami.sh"
