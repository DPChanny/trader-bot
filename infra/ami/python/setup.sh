#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "${SCRIPT_DIR}/../setup.sh"

sudo apt-get install -y --no-install-recommends \
	nodejs \
	npm

curl -fsSL https://astral.sh/uv/install.sh | sudo env UV_INSTALL_DIR=/usr/local/bin sh

bash "${SCRIPT_DIR}/../pm2/ami.sh"
