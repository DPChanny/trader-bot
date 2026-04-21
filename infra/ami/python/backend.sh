#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ "${SKIP_KILL:-0}" != "1" ]; then
	bash "${SCRIPT_DIR}/../kill.sh"
fi
bash "${SCRIPT_DIR}/setup.sh"
bash "${SCRIPT_DIR}/../../nginx/ami.sh"
