#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "${SCRIPT_DIR}/../setup.sh"

curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y --no-install-recommends nodejs
sudo npm install -g npm@latest

curl -fsSL https://astral.sh/uv/install.sh | sudo env UV_INSTALL_DIR=/usr/local/bin sh

if [ -d "/var/www/trader-bot/python" ]; then
	bash -lc 'cd /var/www/trader-bot/python && uv sync --frozen'
fi

bash "${SCRIPT_DIR}/../pm2/ami.sh"
