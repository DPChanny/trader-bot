#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

# Cleanup first: cache, temp, and logs.
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/trader-bot.conf
sudo rm -f /etc/nginx/sites-available/trader-bot.conf

sudo rm -rf /var/www/trader-bot
sudo rm -f /tmp/awscliv2.zip /tmp/amazon-cloudwatch-agent.deb
sudo rm -f /tmp/deploy-infra-*.sh /tmp/deploy-python-*.sh

sudo rm -rf /var/cache/apt/archives/*
sudo rm -rf /home/ubuntu/.npm/_cacache /root/.npm/_cacache
sudo rm -rf /home/ubuntu/.cache/pip /root/.cache/pip
sudo rm -rf /home/ubuntu/.cache/uv /root/.cache/uv

sudo rm -f /var/log/nginx/*.log
sudo rm -f /var/log/redis/redis-server*.log
sudo rm -f /opt/aws/amazon-cloudwatch-agent/logs/*.log
sudo rm -f /home/ubuntu/.pm2/pm2.log
sudo rm -rf /home/ubuntu/.pm2/logs

# Kill/disable services after cleanup.
pm2 kill || true

sudo systemctl stop redis-server || true
sudo systemctl stop nginx || true
sudo systemctl stop pm2-ubuntu || true
sudo systemctl stop amazon-cloudwatch-agent || true

sudo systemctl disable redis-server || true
sudo systemctl disable nginx || true
sudo systemctl disable pm2-ubuntu || true
sudo systemctl disable amazon-cloudwatch-agent || true