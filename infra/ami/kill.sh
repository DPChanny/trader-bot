#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

find /tmp -mindepth 1 -delete || true
find /var/tmp -mindepth 1 -delete || true

find /var/log -type f -exec truncate -s 0 {} + || true
find /opt/aws/amazon-cloudwatch-agent/logs -type f -exec truncate -s 0 {} + || true

truncate -s 0 /home/ubuntu/.bash_history || true
truncate -s 0 /root/.bash_history || true
rm -f /home/ubuntu/.lesshst /root/.lesshst
rm -f /home/ubuntu/.python_history /root/.python_history

rm -f /home/ubuntu/.ssh/known_hosts /root/.ssh/known_hosts

if [ -d "/home/ubuntu/trader-bot/.git" ]; then
	git -C /home/ubuntu/trader-bot clean -fdx
fi

history -c || true
loginctl terminate-user ubuntu || true
