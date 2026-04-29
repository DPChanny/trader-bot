# trader-bot

Discord auction tool monorepo.

## Table of Contents

- [Structure](#structure)
- [Local Development](#local-development)
- [Deploy Map](#deploy-map)
- [Deploy Flow](#deploy-flow)
- [Workflows](#workflows)
- [AMI Setup](#ami-setup)

---

## Structure

| Path                 | Role                                               |
| -------------------- | -------------------------------------------------- |
| `frontend/`          | React SPA (Vite)                                   |
| `python/backend/`    | FastAPI REST + WebSocket server                    |
| `python/bot/`        | Discord bot                                        |
| `python/auction/`    | Auction process                                    |
| `python/shared/`     | Shared domain layer (entities, DTOs, repositories) |
| `infra/`             | Infrastructure scripts and configuration           |
| `.github/workflows/` | Deployment workflows                               |

---

## Local Development

### Prerequisites

- Node.js 24.x + npm
- Python 3.14+
- `uv`
- Docker

### 1. Install dependencies

```bash
cd frontend && npm ci
cd ../python && uv sync
```

### 2. Create env files

**Frontend** — `frontend/.env.example` → `frontend/.env.local`

```env
VITE_PHASE=dev
VITE_API_ORIGIN=http://127.0.0.1:8000
VITE_DISCORD_CLIENT_ID=
VITE_GUILD_INVITE_URL=
```

**Python** — `python/.env.example` → `python/.env`

```env
PHASE=dev

DISCORD_BOT_TOKEN=

DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=

APP_ORIGIN=http://127.0.0.1:5173
API_ORIGIN=http://127.0.0.1:8000

JWT_SECRET=
JWT_ALGORITHM=HS256

DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=trader-bot
DB_NAME=trader-bot
DB_REGION=ap-northeast-2

REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0

LOG_LEVEL=INFO
LOG_TEXT=false
LOG_FILE=true
```

> `PHASE=dev`: uses `DB_HOST` directly with password auth  
> `PHASE=beta|prod`: uses `DB_HOST`/`DB_REGION` with IAM auth (injected by `deploy-python.yml`)  
> All Python services (backend, bot, auction) share `python/.env`

### 3. Start local Postgres

```bash
docker compose -f infra/postgres/docker/docker-compose.yml up -d postgres
```

| Item            | Value                                               |
| --------------- | --------------------------------------------------- |
| Host            | `127.0.0.1`                                         |
| Port            | `5432`                                              |
| DB init scripts | `infra/postgres/docker/docker-entrypoint-initdb.d/` |
| Reference SQL   | `infra/postgres/dbeaver/`                           |

Reset DB volume:

```bash
docker compose -f infra/postgres/docker/docker-compose.yml down -v
docker compose -f infra/postgres/docker/docker-compose.yml up -d postgres
```

### 4. Run services

**VS Code tasks** (`.vscode/tasks.json`):

| Task               | Description                  |
| ------------------ | ---------------------------- |
| `Run Database Dev` | Postgres container           |
| `Run Redis Dev`    | Redis container              |
| `Run Frontend Dev` | Vite dev server              |
| `Run Backend Dev`  | FastAPI (uvicorn --reload)   |
| `Run Bot Dev`      | Discord bot                  |
| `Run Auction Dev`  | Auction process              |
| `Run All Dev`      | All of the above in parallel |

**Equivalent commands:**

```bash
# frontend
cd frontend && npm run dev

# backend
cd python && uv run python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# bot
cd python && uv run python -m bot.main

# auction
cd python && uv run python -m auction.main
```

### 5. Local checks

| Item           | URL / command                      |
| -------------- | ---------------------------------- |
| Frontend       | `http://127.0.0.1:5173`            |
| Backend health | `http://127.0.0.1:8000/health`     |
| Frontend build | `cd frontend && npm run build`     |
| Python lint    | `cd python && uv run ruff check .` |

---

## Deploy Map

`DEPLOY_MAP` is the single source of truth for phase-specific deployment targets and external resources.

- Repository variable name: `DEPLOY_MAP`
- Example file: `.github/workflows/deploy-map.example.json`
- Storage format: one-line minified JSON

```json
{
  "beta": {
    "redis": "i-0000000000000000",
    "redis_host": "10.0.0.1",
    "backend": "i-0000000000000000",
    "bot": "i-0000000000000000",
    "auction": "i-0000000000000000",
    "db_host": "example-beta-rds.com",
    "db_region": "ap-northeast-2",
    "domain": "beta.example.com",
    "bucket": "example-beta-bucket-frontend",
    "cloudfront": "AAAAAAAAAAAAAA"
  },
  "prod": {
    "redis": "i-0000000000000000",
    "redis_host": "10.0.0.1",
    "backend": "i-0000000000000000",
    "bot": "i-0000000000000000",
    "auction": "i-0000000000000000",
    "db_host": "example-prod-rds.com",
    "db_region": "ap-northeast-2",
    "domain": "example.com",
    "bucket": "example-prod-bucket-frontend",
    "cloudfront": "AAAAAAAAAAAAAA"
  }
}
```

| Field        | Meaning                    |
| ------------ | -------------------------- |
| `redis`      | Redis EC2 instance ID      |
| `redis_host` | Redis internal IP (VPC)    |
| `backend`    | Backend EC2 instance ID    |
| `bot`        | Bot EC2 instance ID        |
| `auction`    | Auction EC2 instance ID    |
| `db_host`    | RDS hostname               |
| `db_region`  | RDS AWS region             |
| `domain`     | Public domain              |
| `bucket`     | Frontend S3 bucket         |
| `cloudfront` | CloudFront distribution ID |

Fields consumed per workflow:

| Workflow                      | Fields used                                                                 |
| ----------------------------- | --------------------------------------------------------------------------- |
| `deploy-frontend.yml`         | `domain`, `bucket`, `cloudfront`                                            |
| `deploy-python.yml`           | `backend`, `bot`, `auction`, `domain`, `db_host`, `db_region`, `redis_host` |
| `deploy-instance-backend.yml` | `backend`                                                                   |
| `deploy-instance-bot.yml`     | `bot`                                                                       |
| `deploy-instance-auction.yml` | `auction`                                                                   |
| `deploy-instance-redis.yml`   | `redis`                                                                     |

Generate one-line JSON locally:

```bash
jq -c . .github/workflows/deploy-map.example.json
```

---

## Deploy Flow

### Application code only changed

1. `deploy-python.yml` — roll out backend, bot, and auction
2. `deploy-frontend.yml` — publish frontend artifact

### New instance provisioned (first-time setup)

1. Launch an EC2 instance from the appropriate AMI (built with scripts in `infra/ami/`)
2. `deploy-instance.yml` — specify `phase` and `ref`; configures services on all instances in parallel
3. Run `deploy-python.yml` to deploy the latest application code

---

## Workflows

### Application deployment

#### `deploy-frontend.yml`

- Trigger: tag push (`v*`) or manual `workflow_dispatch`
- Builds frontend, uploads `frontend/dist` to S3, invalidates CloudFront

#### `deploy-python.yml`

- Trigger: tag push (`v*`) or manual `workflow_dispatch`
- Writes `python/.env` remotely via SSM
- Checks out the requested ref on instances and runs `uv sync --frozen`
- Fans out to `deploy-python-backend.yml`, `deploy-python-bot.yml`, and `deploy-python-auction.yml`

#### `deploy-python-backend.yml`

- Trigger: `workflow_call` from `deploy-python.yml`
- Reloads the backend processes via PM2 (`trader-bot-pm2-backend-0` on port 8000, `trader-bot-pm2-backend-1` on port 8001)

#### `deploy-python-bot.yml`

- Trigger: `workflow_call` from `deploy-python.yml`
- Reloads the bot process via PM2 (`trader-bot-pm2-bot`)

#### `deploy-python-auction.yml`

- Trigger: `workflow_call` from `deploy-python.yml`
- Reloads the auction process via PM2 (`trader-bot-pm2-auction`)

### Infrastructure deployment

Instance workflows are manual or reusable only — intended for first-time instance configuration after launching from an AMI, not application code deploys.

#### `deploy-instance.yml`

- Trigger: manual `workflow_dispatch`
- Inputs: `phase`, `ref`
- Runs all four sub-workflows in parallel: `deploy-instance-backend.yml`, `deploy-instance-bot.yml`, `deploy-instance-auction.yml`, `deploy-instance-redis.yml`

#### `deploy-instance-backend.yml`

- Trigger: manual or `workflow_call`
- Git checkout → applies CloudWatch log config for backend → enables nginx with phase-specific site config (`nginx -t` validated) → enables `pm2-ubuntu` systemd service

#### `deploy-instance-bot.yml`

- Trigger: manual or `workflow_call`
- Git checkout → applies CloudWatch log config for bot → enables `pm2-ubuntu` systemd service

#### `deploy-instance-auction.yml`

- Trigger: manual or `workflow_call`
- Git checkout → applies CloudWatch log config for auction → enables `pm2-ubuntu` systemd service

#### `deploy-instance-redis.yml`

- Trigger: manual or `workflow_call`
- Git checkout → applies CloudWatch log config for redis → enables `redis-server` service and confirms health with `redis-cli ping`

---

## AMI Setup

### Entry scripts

Use only these scripts as AMI build entrypoints:

| Script                        | Target       |
| ----------------------------- | ------------ |
| `infra/ami/python/backend.sh` | Backend host |
| `infra/ami/python/bot.sh`     | Bot host     |
| `infra/ami/python/auction.sh` | Auction host |
| `infra/ami/redis.sh`          | Redis host   |

Do not use `infra/ami/setup.sh`, `infra/ami/python/setup.sh`, or `infra/ami/cleanup.sh` directly as entrypoints.

### Script responsibilities

#### `infra/ami/setup.sh`

- Base machine bootstrap — installs `git`, `curl`
- Clones the repository to `/home/ubuntu/trader-bot`
- Delegates CloudWatch agent installation to `infra/cloudwatch/ami.sh`

#### `infra/ami/python/setup.sh`

- Python application host bootstrap
- Installs `uv` and pre-runs `uv sync --frozen`
- Delegates PM2 installation to `infra/pm2/ami.sh`

#### `infra/ami/python/auction.sh`

- Auction host image bootstrap
- Builds on Python host setup
- Creates `/var/log/trader-bot/auction`
- Finishes with `infra/ami/cleanup.sh`

#### `infra/ami/python/backend.sh`

- Backend host image bootstrap
- Builds on Python host setup, adds nginx
- Finishes with `infra/ami/cleanup.sh`

#### `infra/ami/python/bot.sh`

- Bot host image bootstrap
- Python host setup only — no nginx or redis
- Finishes with `infra/ami/cleanup.sh`

#### `infra/ami/redis.sh`

- Redis host image bootstrap
- Base setup plus redis package only, left disabled/stopped
- Finishes with `infra/ami/cleanup.sh`

#### `infra/ami/cleanup.sh`

- Pre-capture cleanup script
- Removes temp files, logs, shell history, and SSH known hosts
- Runs `git clean -fdx` inside the repo
- Terminates `ubuntu` login sessions before imaging

### Supporting AMI installers

#### `infra/cloudwatch/ami.sh`

- Installs CloudWatch agent package
- Initializes agent config directory
- Leaves service disabled/stopped for workflows to apply runtime config

#### `infra/nginx/ami.sh`

- Installs nginx package and validates the default installation
- Clears `sites-available` and `sites-enabled`
- Leaves service disabled/stopped

#### `infra/pm2/ami.sh`

- Installs Node.js 24, latest npm, and PM2
- Creates `/home/ubuntu/.pm2`
- Registers PM2 systemd startup for user `ubuntu`
- Leaves `pm2-ubuntu` disabled/stopped — deployment workflows control activation

### Runtime notes

- PM2 app definitions: `infra/pm2/ecosystem.config.mjs`
- Backend process names: `trader-bot-pm2-backend-0` (port 8000), `trader-bot-pm2-backend-1` (port 8001)
- Bot process name: `trader-bot-pm2-bot`
- Auction process name: `trader-bot-pm2-auction`
- Frontend deployment: S3 static hosting only
- Python deployment: AWS SSM-based, no SSH
