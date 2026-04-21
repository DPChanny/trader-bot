#!/usr/bin/env bash
set -euo pipefail

export DEBIAN_FRONTEND=noninteractive

sudo systemctl stop redis-server || true
sudo systemctl stop nginx || true
sudo systemctl stop pm2-ubuntu || true
sudo systemctl stop amazon-cloudwatch-agent || true

sudo systemctl disable redis-server || true
sudo systemctl disable nginx || true
sudo systemctl disable pm2-ubuntu || true
sudo systemctl disable amazon-cloudwatch-agent || true

pm2 kill || true

sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/trader-bot.conf
sudo rm -f /etc/nginx/sites-available/trader-bot.conf

sudo rm -rf /var/www/trader-bot
sudo rm -f /tmp/awscliv2.zip /tmp/amazon-cloudwatch-agent.deb
sudo rm -f /tmp/deploy-infra-*.sh /tmp/deploy-python-*.sh