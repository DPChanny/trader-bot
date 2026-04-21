#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bash "${SCRIPT_DIR}/kill.sh"

SKIP_KILL=1 bash "${SCRIPT_DIR}/redis.sh"
SKIP_KILL=1 bash "${SCRIPT_DIR}/python/backend.sh"
SKIP_KILL=1 bash "${SCRIPT_DIR}/python/bot.sh"
