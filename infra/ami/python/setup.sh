#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

bash /var/www/trader-bot/infra/ami/setup.sh

curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y --no-install-recommends nodejs
sudo npm install -g npm@latest

curl -fsSL https://astral.sh/uv/install.sh | sudo env UV_INSTALL_DIR=/usr/local/bin sh

if [ -d "/var/www/trader-bot/python" ]; then
	bash -lc 'uv sync --frozen --project /var/www/trader-bot/python'
fi

bash /var/www/trader-bot/infra/pm2/ami.sh
