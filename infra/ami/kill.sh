#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

sudo find /tmp -mindepth 1 -delete || true
sudo find /var/tmp -mindepth 1 -delete || true

sudo find /var/log -type f -exec truncate -s 0 {} + || true
sudo find /opt/aws/amazon-cloudwatch-agent/logs -type f -exec truncate -s 0 {} + || true

sudo truncate -s 0 /home/ubuntu/.bash_history || true
sudo truncate -s 0 /root/.bash_history || true
sudo rm -f /home/ubuntu/.lesshst /root/.lesshst
sudo rm -f /home/ubuntu/.python_history /root/.python_history

sudo rm -f /home/ubuntu/.ssh/known_hosts /root/.ssh/known_hosts

if [ -d "/home/ubuntu/trader-bot/.git" ]; then
	git -C /home/ubuntu/trader-bot clean -fdx
fi

history -c || true
sudo loginctl terminate-user ubuntu || true
