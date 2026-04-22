#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

apt-get install -y --no-install-recommends redis-server
systemctl disable redis-server
systemctl stop redis-server || true
