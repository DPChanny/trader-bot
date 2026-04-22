#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

bash /home/ubuntu/trader-bot/infra/ami/setup.sh

curl -fsSL https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh

if [ -d "/home/ubuntu/trader-bot/python" ]; then
	bash -lc 'uv sync --frozen --project /home/ubuntu/trader-bot/python'
fi

bash /home/ubuntu/trader-bot/infra/pm2/ami.sh
