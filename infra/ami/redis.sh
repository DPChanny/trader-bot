#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/base.sh"

sudo apt-get update
sudo apt-get install -y --no-install-recommends redis-server

sudo systemctl enable redis-server
sudo systemctl stop redis-server || true
