#!/usr/bin/env bash
set -euo pipefail

if [ "${EUID}" -ne 0 ]; then
	echo "Run as root"
	exit 1
fi

export DEBIAN_FRONTEND=noninteractive

TMP_DEB="/tmp/amazon-cloudwatch-agent.deb"
curl -fsSL "https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/arm64/latest/amazon-cloudwatch-agent.deb" -o "${TMP_DEB}"
dpkg -i "${TMP_DEB}" || apt-get -f install -y
rm -f "${TMP_DEB}"

install -d -m 755 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.d

systemctl enable amazon-cloudwatch-agent
systemctl stop amazon-cloudwatch-agent || true
