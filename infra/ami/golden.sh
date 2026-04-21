#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "${SCRIPT_DIR}/setup.sh"
bash "${SCRIPT_DIR}/python/setup.sh"
bash "${SCRIPT_DIR}/../nginx/ami.sh"

sudo apt-get install -y --no-install-recommends redis-server
sudo systemctl enable redis-server
sudo systemctl stop redis-server || true

bash "${SCRIPT_DIR}/kill.sh"
