# GitHub Actions Variables and Secrets

This document tracks repository-level GitHub Actions Variables and Secrets used by deployment workflows.

## Variable Namespaces

Use three variable namespaces:

- `APP_*`: application runtime deployment (backend, bot, pm2, python env)
- `EDGE_*`: frontend and cloudfront deployment
- `INSTANCE_*`: manual instance bootstrap workflows

## Repository Variables

### APP variables

- `APP_AWS_REGION`: AWS region for app workflows
- `APP_EC2_INSTANCE_ID`: EC2 instance id used by app deploy workflows
- `APP_EC2_HOST`: app domain/host used to compose origins
- `APP_DISCORD_CLIENT_ID`: Discord client id for app env and frontend-compatible config
- `APP_RDS_INSTANCE_IDENTIFIER`: RDS identifier injected into python env

Used by:

- `.github/workflows/app-deploy-backend.yml`
- `.github/workflows/app-deploy-bot.yml`
- `.github/workflows/app-deploy-pm2.yml`
- `.github/workflows/app-deploy-python-env.yml`

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

Used by:

- `.github/workflows/instance-deploy-backend.yml`
- `.github/workflows/instance-deploy-bot.yml`
- `.github/workflows/instance-deploy-redis.yml`

## Repository Secrets

These remain shared across namespaces.

- `AWS_ACCESS_KEY_ID`
- `AWS_ACCESS_KEY_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_SECRET`
- `JWT_SECRET`

Used by:

- app workflows for AWS auth and python env generation
- edge workflows for AWS auth
- instance workflows for AWS auth

## Setup Checklist

1. Open repository settings.
2. Go to Secrets and variables, Actions.
3. Create all APP/EDGE/INSTANCE variables listed above.
4. Confirm required secrets exist.
5. Run one workflow from each namespace to validate:
   - `app-deploy-python-env`
   - `edge-deploy-frontend`
   - `instance-deploy-backend`
