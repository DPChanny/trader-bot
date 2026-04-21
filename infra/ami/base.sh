#!/usr/bin/env bash
set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
	echo "Run as root"
	exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get install -y --no-install-recommends \
	curl \
	git \
	unzip \
	htop

curl "https://awscli.amazonaws.com/awscli-exe-linux-aarch64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install
rm -rf awscliv2.zip ./aws
