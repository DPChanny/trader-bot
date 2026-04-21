#!/usr/bin/env bash
set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
	echo "Run as root"
	exit 1
fi

export DEBIAN_FRONTEND=noninteractive

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "${SCRIPT_DIR}/base.sh"

apt-get update
apt-get install -y --no-install-recommends redis-server

systemctl enable redis-server
systemctl stop redis-server || true
