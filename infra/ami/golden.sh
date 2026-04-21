#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "${SCRIPT_DIR}/redis.sh"
bash "${SCRIPT_DIR}/python/backend.sh"
bash "${SCRIPT_DIR}/python/bot.sh"
