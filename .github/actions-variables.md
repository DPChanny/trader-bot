# GitHub Actions Variables and Secrets

This document tracks repository-level GitHub Actions Variables and Secrets used by deployment workflows.

## Repository Variables

### Global variables

- `AWS_REGION`: AWS region used by all workflows
- `NGINX_INSTANCE_ID`: default instance id for nginx workflow (supports multiple ids via input)
- `CLOUDWATCH_INSTANCE_ID`: default instance id for cloudwatch workflow (supports multiple ids via input)
- `PM2_INSTANCE_ID`: default instance id for pm2 workflow (supports multiple ids via input)
- `DISCORD_CLIENT_ID`: Discord client id used by python env generation and frontend build
- `RDS_INSTANCE_ID`: RDS identifier injected into python env
- `DOMAIN`: app domain/host used to compose origins
- `GUILD_INVITE_URL`: guild invite url injected into frontend build env
- `S3_BUCKET_NAME`: S3 bucket for frontend static deployment
- `CLOUDFRONT_DISTRIBUTION_ID`: distribution id for invalidation

Used by:

- `.github/workflows/python-deploy-env.yml`
- `.github/workflows/python-deploy-backend.yml`
- `.github/workflows/python-deploy-bot.yml`
- `.github/workflows/infra-deploy-nginx.yml`
- `.github/workflows/infra-deploy-cloudwatch.yml`
- `.github/workflows/infra-deploy-pm2.yml`
- `.github/workflows/frontend-deploy-build.yml`
- `.github/workflows/frontend-deploy-cdn.yml`

## Repository Secrets

These remain shared across namespaces.

- `AWS_ACCESS_KEY_ID`
- `AWS_ACCESS_KEY_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_SECRET`
- `JWT_SECRET`

Used by:

- python workflows for AWS auth and python env generation
- frontend workflows for AWS auth
- infra workflows for AWS auth

### Same Instance ID Case

- Backend and bot workflows depend on infra instance targets (`NGINX_INSTANCE_ID`, `CLOUDWATCH_INSTANCE_ID`, `PM2_INSTANCE_ID`).
- `python-deploy-env`, `python-deploy-backend`, and `python-deploy-bot` deduplicate these instance ids and apply once per unique target.
- Backend and bot workflows both use `python-deploy-runtime-${PM2_INSTANCE_ID}` concurrency group.

## Setup Checklist

1. Open repository settings.
2. Go to Secrets and variables, Actions.
3. Create all global variables listed above.
4. Confirm required secrets exist.
5. Run representative workflows to validate:
   - `python-deploy-env`
   - `frontend-deploy-build`
   - `infra-deploy-nginx`
