# trader-bot

Discord auction tool monorepo.

- Frontend app: `frontend/`
- Python API server: `python/backend/`
- Discord bot: `python/bot/`
- Shared domain layer: `python/shared/`
- Infra assets: `infra/`
- Deployment workflows: `.github/workflows/`

## Local Development

README is organized around local development first. Deployment details are documented later in this file.

### Prerequisites

- Node.js 24.x
- npm
- Python 3.14+
- `uv`
- Docker

### 1. Install dependencies

Frontend:

```bash
cd frontend
npm ci
```

Python:

```bash
cd ../python
uv sync
```

### 2. Create local env files

Frontend:

- Copy `frontend/.env.example` to `frontend/.env.local`
- Recommended local values:

```env
VITE_PHASE=dev
VITE_API_ORIGIN=http://127.0.0.1:8000
VITE_DISCORD_CLIENT_ID=
VITE_GUILD_INVITE_URL=
```

Python:

- Copy `python/.env.example` to `python/.env`
- Important local values:

```env
PHASE=dev

DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

APP_ORIGIN=http://127.0.0.1:5173
API_ORIGIN=http://127.0.0.1:8000

JWT_SECRET=
JWT_ALGORITHM=HS256

RDS_INSTANCE_ID=
RDS_REGION=ap-northeast-2

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=trader-bot
DB_NAME=trader-bot
```

Notes:

- `PHASE=dev` uses local Postgres.
- `PHASE=beta|prod` switches to RDS resolution and IAM auth flow in Python runtime.
- Backend and bot both read `python/.env`.

### 3. Start local Postgres

From repository root:

```bash
docker compose -f infra/postgres/docker/docker-compose.yml up -d postgres
```

Local Postgres defaults:

- Host: `127.0.0.1`
- Port: `5432`
- Superuser DB: `postgres`
- App DB init scripts: `infra/postgres/docker/docker-entrypoint-initdb.d/`
- Reference SQL files: `infra/postgres/dbeaver/`

Reset DB volume:

```bash
docker compose -f infra/postgres/docker/docker-compose.yml down -v
docker compose -f infra/postgres/docker/docker-compose.yml up -d postgres
```

### 4. Run services

VS Code tasks:

- `Run Database Dev`
- `Run Frontend Dev`
- `Run Backend Dev`
- `Run Bot Dev`
- `Run All Dev`

Equivalent commands:

```bash
# frontend
cd frontend
npm run dev

# backend
cd python
uv run python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# bot
cd python
uv run python -m bot.main
```

### 5. Local checks

- Frontend: `http://127.0.0.1:5173`
- Backend health: `http://127.0.0.1:8000/health`
- Frontend build check: `cd frontend && npm run build`
- Python lint check: `cd python && uv run ruff check .`

## Deploy Map

`DEPLOY_MAP` is the single source of truth for phase-specific deployment targets and external resources.

- Repository variable name: `DEPLOY_MAP`
- Example file: `.github/workflows/deploy-map.example.json`
- Format: one-line minified JSON when stored in GitHub Variables

Example shape:

```json
{
  "beta": {
    "redis": "i-0000000000000000",
    "backend": "i-0000000000000000",
    "bot": "i-0000000000000000",
    "rds": "example-beta-rds",
    "domain": "beta.example.com",
    "bucket": "example-beta-bucket-frontend",
    "cloudfront": "AAAAAAAAAAAAAA"
  },
  "prod": {
    "redis": "i-0000000000000000",
    "backend": "i-0000000000000000",
    "bot": "i-0000000000000000",
    "rds": "example-prod-rds",
    "domain": "example.com",
    "bucket": "example-prod-bucket-frontend",
    "cloudfront": "AAAAAAAAAAAAAA"
  }
}
```

Field meanings:

- `redis`: Redis instance ID
- `backend`: backend instance ID
- `bot`: bot instance ID
- `rds`: RDS instance identifier used by Python deploy/runtime
- `domain`: public domain used by frontend and Python env generation
- `bucket`: S3 bucket for frontend artifact upload
- `cloudfront`: CloudFront distribution ID for invalidation

How workflows consume `DEPLOY_MAP`:

- `deploy-frontend.yml`: `domain`, `bucket`, `cloudfront`
- `deploy-python.yml`: `backend`, `bot`, `domain`, `rds`
- `deploy-infra-cloudwatch.yml`: `backend`, `bot`, `redis`
- `deploy-infra-nginx.yml`: `backend`
- `deploy-infra-pm2.yml`: `backend`, `bot`
- `deploy-infra-redis.yml`: `redis`

Generate one-line JSON locally:

```bash
jq -c . .github/workflows/deploy-map.example.json
```

## Workflow Responsibilities

### Application deploy workflows

#### `deploy-frontend.yml`

- Trigger: tag push (`v*`) or manual `workflow_dispatch`
- Responsibility: build frontend, upload `frontend/dist` to S3, invalidate CloudFront
- Uses `DEPLOY_MAP` to derive target domain and frontend delivery resources

#### `deploy-python.yml`

- Trigger: tag push (`v*`) or manual `workflow_dispatch`
- Responsibility: prepare Python runtime on target hosts
- Writes `python/.env` remotely through SSM
- Checks out requested ref on instances
- Runs `uv sync --frozen` on backend and bot hosts
- Then fans out to backend and bot rollout workflows

#### `deploy-python-backend.yml`

- Trigger: `workflow_call` from `deploy-python.yml`
- Responsibility: reload backend process through PM2 on backend instance
- Uses `infra/pm2/ecosystem.config.mjs` entry `trader-bot-pm2-backend`

#### `deploy-python-bot.yml`

- Trigger: `workflow_call` from `deploy-python.yml`
- Responsibility: reload bot process through PM2 on bot instance
- Uses `infra/pm2/ecosystem.config.mjs` entry `trader-bot-pm2-bot`

### Infra deploy workflows

Infra workflows are now manual or reusable only. They are intended for AMI provisioning and host capability rollout, not for tag-push application deploys.

#### `deploy-infra.yml`

- Trigger: manual `workflow_dispatch`
- Responsibility: top-level infra orchestrator
- Inputs: `phase`, `ref`, `ami`
- `ami` values: `backend`, `bot`, `redis`, `golden`
- Calls sub workflows in dependency order instead of applying everything blindly

Dispatch behavior:

- Always runs `deploy-infra-cloudwatch.yml` first
- Runs `deploy-infra-redis.yml` when `ami=redis` or `ami=golden`
- Runs `deploy-infra-nginx.yml` when `ami=backend` or `ami=golden`
- Runs `deploy-infra-pm2.yml` when `ami=backend`, `ami=bot`, or `ami=golden`

#### `deploy-infra-cloudwatch.yml`

- Trigger: manual `workflow_dispatch` or `workflow_call`
- Responsibility: apply CloudWatch agent base config and role-specific append config
- Target selection depends on `ami`
- Backend, bot, redis, or all relevant instances can be configured from one workflow

#### `deploy-infra-nginx.yml`

- Trigger: manual `workflow_dispatch` or `workflow_call`
- Responsibility: install phase-specific nginx site config on backend host
- Copies `infra/nginx/sites-available/trader-bot-{phase}-nginx.conf`
- Enables nginx and validates config with `nginx -t`

#### `deploy-infra-pm2.yml`

- Trigger: manual `workflow_dispatch` or `workflow_call`
- Responsibility: enable PM2 system service on backend and/or bot hosts
- This workflow prepares the process supervisor itself
- Actual application reload remains the responsibility of `deploy-python-backend.yml` and `deploy-python-bot.yml`

#### `deploy-infra-redis.yml`

- Trigger: manual `workflow_dispatch` or `workflow_call`
- Responsibility: enable and verify Redis service on redis host
- Confirms service health with `redis-cli ping`

## Recommended Deploy Flow

### When infra or AMI composition changed

1. Build or update the target AMI with the relevant shell scripts in `infra/ami/`
2. Run `deploy-infra.yml` with the correct `phase`, `ref`, and `ami`
3. Run `deploy-python.yml` if Python runtime or env changed
4. Run `deploy-frontend.yml` if frontend artifact changed

### When only application code changed

1. Run `deploy-python.yml` for backend and bot code
2. Run `deploy-frontend.yml` for frontend code

## AMI Shell Responsibilities

### Entry scripts in `infra/ami/`

#### `infra/ami/setup.sh`

- Base machine bootstrap
- Installs common OS utilities such as `curl`, `git`, `lsof`, `htop`
- Clones the repository to `/home/ubuntu/trader-bot`
- Delegates CloudWatch agent installation to `infra/cloudwatch/ami.sh`

#### `infra/ami/python/setup.sh`

- Python application host bootstrap
- Runs `infra/ami/setup.sh`
- Installs `uv`
- Pre-syncs Python dependencies with `uv sync --frozen`
- Delegates PM2 installation to `infra/pm2/ami.sh`

#### `infra/ami/golden.sh`

- Full superset image bootstrap
- Builds on Python host setup
- Adds nginx and redis packages
- Leaves redis disabled/stopped by default
- Finishes with cleanup via `infra/ami/kill.sh`
- Good fit for a reusable golden AMI baseline

#### `infra/ami/python/backend.sh`

- Backend host image bootstrap
- Builds on Python host setup
- Adds nginx for reverse proxy termination
- Finishes with cleanup via `infra/ami/kill.sh`

#### `infra/ami/python/bot.sh`

- Bot host image bootstrap
- Builds on Python host setup
- Does not install nginx or redis
- Finishes with cleanup via `infra/ami/kill.sh`

#### `infra/ami/redis.sh`

- Redis host image bootstrap
- Builds on base setup
- Installs redis package only
- Leaves redis disabled/stopped by default
- Finishes with cleanup via `infra/ami/kill.sh`

#### `infra/ami/kill.sh`

- AMI capture cleanup script
- Clears temp files, logs, shell history, and SSH known hosts
- Runs `git clean -fdx` inside the repo when present
- Terminates `ubuntu` login sessions to reduce leftover state before imaging

### Supporting AMI-related installers

#### `infra/cloudwatch/ami.sh`

- Installs Amazon CloudWatch Agent package
- Creates and resets CloudWatch agent config directory
- Leaves service disabled/stopped so workflows can apply the right runtime config later

#### `infra/nginx/ami.sh`

- Installs nginx package
- Validates default nginx installation
- Clears `sites-available` and `sites-enabled`
- Leaves service disabled/stopped for later workflow-driven activation

#### `infra/pm2/ami.sh`

- Installs Node.js 24, latest npm, and PM2
- Creates `/home/ubuntu/.pm2`
- Registers PM2 systemd startup for user `ubuntu`
- Leaves `pm2-ubuntu` disabled/stopped so deployment workflows control activation timing

## Runtime Notes

- PM2 app definitions live in `infra/pm2/ecosystem.config.mjs`
- Backend process name: `trader-bot-pm2-backend`
- Bot process name: `trader-bot-pm2-bot`
- Frontend deployment is static hosting only
- Python deployment uses AWS SSM instead of SSH-based rollout
