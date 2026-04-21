#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/../setup.sh"

sudo apt-get install -y --no-install-recommends \
	nodejs \
	npm

bash "${SCRIPT_DIR}/../pm2/ami.sh"
