# GitHub Actions Variables and Secrets

This document tracks repository-level GitHub Actions Variables and Secrets used by deployment workflows.

## Variable Namespaces

Use three variable namespaces:

- `PYTHON_*`: python runtime deployment (backend, bot, env)
- `EDGE_*`: frontend and cloudfront deployment
- `INFRA_*`: infra deployment workflows (cloudwatch, nginx, pm2)

## Repository Variables

### PYTHON variables

- `PYTHON_AWS_REGION`: AWS region for python workflows
- `PYTHON_BACKEND_INSTANCE_ID`: backend deploy target instance id
- `PYTHON_BOT_INSTANCE_ID`: bot deploy target instance id
- `PYTHON_EC2_HOST`: app domain/host used to compose origins
- `PYTHON_DISCORD_CLIENT_ID`: Discord client id for python env generation
- `PYTHON_RDS_INSTANCE_IDENTIFIER`: RDS identifier injected into python env

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

- `.github/workflows/frontend-deploy-build.yml`
- `.github/workflows/frontend-deploy-cdn.yml`

### INFRA variables

- `INFRA_AWS_REGION`: AWS region for infra workflows
- `INFRA_NGINX_INSTANCE_ID`: default instance id for nginx infra workflow (supports multiple ids via input)
- `INFRA_CLOUDWATCH_INSTANCE_ID`: default instance id for cloudwatch infra workflow (supports multiple ids via input)
- `INFRA_PM2_INSTANCE_ID`: default instance id for pm2 infra workflow (supports multiple ids via input)

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

### Same Instance ID Case

- `PYTHON_BACKEND_INSTANCE_ID` and `PYTHON_BOT_INSTANCE_ID` can be the same value.
- Backend and bot workflows both use `python-deploy-runtime-${instance_id}` concurrency group.
- If the ids are equal, runs are serialized automatically (race condition avoided).
- `python-deploy-env` deduplicates the two ids and writes `.env` only once per unique instance.

## Setup Checklist

1. Open repository settings.
2. Go to Secrets and variables, Actions.
3. Create all PYTHON/EDGE/INFRA variables listed above.
4. Confirm required secrets exist.
5. Run one workflow from each namespace to validate:
   - `python-deploy-env`
   - `frontend-deploy-build`
   - `infra-deploy-nginx`
