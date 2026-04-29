#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

TMP_DEB="/tmp/amazon-cloudwatch-agent.deb"
curl -fsSL "https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/arm64/latest/amazon-cloudwatch-agent.deb" -o "${TMP_DEB}"
dpkg -i "${TMP_DEB}" || apt-get -f install -y
rm -f "${TMP_DEB}"

install -d -m 755 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.d
rm -f /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.d/* || true

systemctl disable amazon-cloudwatch-agent
systemctl stop amazon-cloudwatch-agent || true
