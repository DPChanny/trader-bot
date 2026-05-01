#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

cd /

apt-get install -y --no-install-recommends redis-server

install -m 640 -o redis -g redis /home/ubuntu/trader-bot/infra/redis/redis.conf /etc/redis/redis.conf

systemctl disable redis-server
systemctl stop redis-server || true
