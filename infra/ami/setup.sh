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

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "${TMP_DIR}/awscliv2.zip"
unzip -q "${TMP_DIR}/awscliv2.zip" -d "${TMP_DIR}"
sudo "${TMP_DIR}/aws/install" --update

sudo install -d -m 755 -o ubuntu -g ubuntu /var/www
sudo rm -rf /var/www/trader-bot
git clone https://github.com/DPChanny/trader-bot /var/www/trader-bot

bash /var/www/trader-bot/infra/cloudwatch/ami.sh
