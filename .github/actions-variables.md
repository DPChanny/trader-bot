# GitHub Actions Variables and Secrets

This document tracks repository-level GitHub Actions Variables and Secrets used by workflow runs.

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
- `S3_BUCKET_NAME`: S3 bucket for frontend static sync
- `CLOUDFRONT_DISTRIBUTION_ID`: distribution id for invalidation

## Repository Secrets

These remain shared across namespaces.

- `AWS_ACCESS_KEY_ID`
- `AWS_ACCESS_KEY_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_SECRET`
- `JWT_SECRET`

### Same Instance ID Case

- Backend runtime run depends on infra instance targets (`NGINX_INSTANCE_ID`, `CLOUDWATCH_INSTANCE_ID`, `PM2_INSTANCE_ID`).
- Bot runtime run and python env run depend on (`CLOUDWATCH_INSTANCE_ID`, `PM2_INSTANCE_ID`) and do not require `NGINX_INSTANCE_ID`.
- `python-env`, `python-backend`, and `python-bot` deduplicate instance ids and apply once per unique target.
- Workflow concurrency groups are aligned to workflow file names (for example: `python-env`, `python-backend`, `python-bot`).

## Setup Checklist

1. Open repository settings.
2. Go to Secrets and variables, Actions.
3. Create all global variables listed above.
4. Confirm required secrets exist.
5. Run representative workflows to validate:

- `python-env`
- `frontend-build`
- `infra-nginx`

## Infra Dispatch Rules

- `infra-cloudwatch` and `infra-pm2` use unified `workflow_dispatch` input `target` (`backend`, `bot`, `all`).
- Both workflows auto-compose target instance ids, and exclude `NGINX_INSTANCE_ID` when `target=bot`.
- `infra-nginx` is fixed to backend behavior (no `target` input), because bot has no nginx dependency.
- Infra workflows auto-run on path changes:
  - `infra-nginx`: `infra/nginx/**`
  - `infra-cloudwatch`: `infra/cloudwatch/**`
  - `infra-pm2`: `infra/pm2/**`
- For auto-runs, cloudwatch and pm2 execute with `target=all` by default.
