#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

TMP_DEB="/tmp/amazon-cloudwatch-agent.deb"
curl -fsSL "https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/arm64/latest/amazon-cloudwatch-agent.deb" -o "${TMP_DEB}"
sudo dpkg -i "${TMP_DEB}" || sudo apt-get -f install -y
rm -f "${TMP_DEB}"

sudo install -d -m 755 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.d

sudo systemctl disable amazon-cloudwatch-agent
sudo systemctl stop amazon-cloudwatch-agent || true
