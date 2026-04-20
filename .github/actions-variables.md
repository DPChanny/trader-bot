# GitHub Actions Variables and Secrets

This document tracks repository-level GitHub Actions Variables and Secrets used by deployment workflows.

## Variable Namespaces

Use three variable namespaces:

- `APP_*`: application runtime deployment (python-backend, python-bot, python-env)
- `EDGE_*`: frontend and cloudfront deployment
- `INSTANCE_*`: infra deployment workflows (cloudwatch, nginx, pm2)

## Repository Variables

### APP variables

- `APP_AWS_REGION`: AWS region for app workflows
- `APP_EC2_INSTANCE_ID`: EC2 instance id used by app deploy workflows
- `APP_EC2_HOST`: app domain/host used to compose origins
- `APP_DISCORD_CLIENT_ID`: Discord client id for app env and frontend-compatible config
- `APP_RDS_INSTANCE_IDENTIFIER`: RDS identifier injected into python env

Used by:

- `.github/workflows/python-deploy-backend.yml`
- `.github/workflows/python-deploy-bot.yml`
- `.github/workflows/python-deploy-env.yml`

### EDGE variables

- `EDGE_AWS_REGION`: AWS region for edge workflows
- `EDGE_EC2_HOST`: API host injected into frontend build env
- `EDGE_DISCORD_CLIENT_ID`: Discord client id injected into frontend build env
- `EDGE_GUILD_INVITE_URL`: guild invite url injected into frontend build env
- `EDGE_S3_BUCKET`: S3 bucket for frontend static deployment
- `EDGE_CLOUDFRONT_DISTRIBUTION_ID`: distribution id for invalidation

Used by:

- `.github/workflows/edge-deploy-frontend.yml`
- `.github/workflows/edge-deploy-cloudfront.yml`

### INSTANCE variables

- `INSTANCE_AWS_REGION`: AWS region for manual instance workflows
- `INSTANCE_NGINX_INSTANCE_IDS`: default instance list for nginx infra workflow
- `INSTANCE_CLOUDWATCH_INSTANCE_IDS`: default instance list for cloudwatch infra workflow
- `INSTANCE_PM2_INSTANCE_IDS`: default instance list for pm2 infra workflow

Used by:

- `.github/workflows/infra-deploy-nginx.yml`
- `.github/workflows/infra-deploy-cloudwatch.yml`
- `.github/workflows/infra-deploy-pm2.yml`

## Repository Secrets

These remain shared across namespaces.

- `AWS_ACCESS_KEY_ID`
- `AWS_ACCESS_KEY_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_SECRET`
- `JWT_SECRET`

Used by:

- python workflows for AWS auth and python env generation
- edge workflows for AWS auth
- infra workflows for AWS auth

## Setup Checklist

1. Open repository settings.
2. Go to Secrets and variables, Actions.
3. Create all APP/EDGE/INSTANCE variables listed above.
4. Confirm required secrets exist.
5. Run one workflow from each namespace to validate:
   - `python-deploy-env`
   - `edge-deploy-frontend`
   - `infra-deploy-nginx`
