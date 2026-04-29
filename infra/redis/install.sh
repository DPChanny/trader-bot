#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

apt-get install -y --no-install-recommends redis-server

ln -sfn /home/ubuntu/trader-bot/infra/redis/redis.conf /etc/redis/redis.conf

install -d -m 755 -o redis -g redis /var/log/trader-bot/redis

systemctl disable redis-server
systemctl stop redis-server || true
