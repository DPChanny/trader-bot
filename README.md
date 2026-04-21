# trader-bot

Discord auction tool monorepo.

- Frontend app: frontend/
- Python API server: python/backend/
- Discord bot: python/bot/
- Shared domain layer: python/shared/
- Infra assets: infra/

## Development Setup

### Prerequisites

- Node.js 24.x
- npm
- Python 3.12+
- uv
- Docker (for local Postgres)

Optional:

- AWS CLI (useful for deployment checks)

### 1) Install dependencies

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

### 2) Create local env files

Python runtime env:

- Create python/.env from python/.env.example

Frontend local env:

- Create frontend/.env.local

Minimal example:

```env
VITE_PHASE=dev
VITE_API_ORIGIN=http://127.0.0.1:8000
VITE_DISCORD_CLIENT_ID=123456789012345678
VITE_GUILD_INVITE_URL=https://discord.gg/your-invite
```

### 3) Start local database (Postgres)

From repository root:

```bash
docker compose -f infra/postgres/docker/docker-compose.yml up -d postgres
```

Reinitialize DB:

```bash
docker compose -f infra/postgres/docker/docker-compose.yml down -v
docker compose -f infra/postgres/docker/docker-compose.yml up -d postgres
```

### 4) Run local services

VS Code tasks:

- Run Frontend Dev
- Run Backend Dev
- Run Bot Dev
- Run All Dev

Equivalent commands:

```bash
# frontend
cd frontend && npm run dev

# backend
cd python && uv run python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000

# bot
cd python && uv run python -m bot.main
```

Health checks:

- Frontend: http://127.0.0.1:5173
- Backend: http://127.0.0.1:8000/health

## Runtime Environment Notes

Python key envs (python/.env):

- PHASE (dev|beta|prod, default dev)
- DISCORD_BOT_TOKEN
- DISCORD_CLIENT_ID
- DISCORD_CLIENT_SECRET
- APP_ORIGIN
- API_ORIGIN
- JWT_SECRET
- RDS_INSTANCE_ID
- RDS_REGION (default ap-northeast-2)

DB behavior:

- PHASE=dev: local Postgres
- PHASE=beta|prod: resolves RDS endpoint and uses IAM auth token logic in python/shared/utils/db.py

## Deployment Setup (GitHub Actions + AWS SSM)

Current deployment model:

- Phase: beta, prod
- Role: redis, backend, bot
- Infra: nginx, pm2, cloudwatch
- Target instances are selected from repository variable DEPLOY_MAP

### 1) Prepare AMI/instances

Assumed preinstalled on instances:

- nginx
- amazon-cloudwatch-agent
- redis server
- pm2
- uv
- npm

Expected initial state:

- daemons can be inactive (workflows enable/start or reload as needed)
- nginx default config and sites-\* may be empty
- cloudwatch agent directory may be empty

### 2) Configure repository Variables and Secrets

Required Variables:

- AWS_REGION
- DEPLOY_MAP
- BETA_DOMAIN (or fallback DOMAIN)
- PROD_DOMAIN (or fallback DOMAIN)
- BETA_RDS_INSTANCE_ID (or fallback RDS_INSTANCE_ID)
- PROD_RDS_INSTANCE_ID (or fallback RDS_INSTANCE_ID)
- DISCORD_CLIENT_ID
- GUILD_INVITE_URL
- BETA_S3_BUCKET_NAME (or fallback S3_BUCKET_NAME)
- PROD_S3_BUCKET_NAME (or fallback S3_BUCKET_NAME)
- BETA_CLOUDFRONT_DISTRIBUTION_ID (or fallback CLOUDFRONT_DISTRIBUTION_ID)
- PROD_CLOUDFRONT_DISTRIBUTION_ID (or fallback CLOUDFRONT_DISTRIBUTION_ID)

Required Secrets:

- AWS_ACCESS_KEY_ID
- AWS_ACCESS_KEY_SECRET
- DISCORD_BOT_TOKEN
- DISCORD_CLIENT_SECRET
- JWT_SECRET

### 3) Define DEPLOY_MAP

Use template file:

- .github/workflows/deploy-map.example.json

Template shape:

```json
{
  "beta": {
    "redis": "i-REPLACE_BETA_REDIS",
    "backend": ["i-REPLACE_BETA_BACKEND"],
    "bot": ["i-REPLACE_BETA_BACKEND"]
  },
  "prod": {
    "redis": "i-REPLACE_PROD_REDIS",
    "backend": ["i-REPLACE_PROD_BACKEND_A", "i-REPLACE_PROD_BACKEND_B"],
    "bot": ["i-REPLACE_PROD_BOT"]
  }
}
```

Set DEPLOY_MAP with minified one-line JSON.

Example (local conversion):

```bash
jq -c . .github/workflows/deploy-map.example.json
```

### 4) Deployment workflows

Frontend:

- .github/workflows/deploy-frontend.yml
  - Build frontend
  - Sync to S3
  - CloudFront invalidation

Python:

- .github/workflows/deploy-python.yml
  - Writes python/.env over SSM
  - Runs uv sync --frozen
  - Targets backend and bot instance set from DEPLOY_MAP

- .github/workflows/deploy-python-backend.yml
  - Backend process rollout via pm2
  - CloudWatch backend config apply

- .github/workflows/deploy-python-bot.yml
  - Bot process rollout via pm2
  - CloudWatch bot config apply

Infra:

- .github/workflows/deploy-infra-nginx.yml
  - Installs phase-specific nginx config
  - nginx -t then reload/start

- .github/workflows/deploy-infra-pm2.yml
  - Applies pm2 ecosystem
  - Supports target: backend|bot|all

- .github/workflows/deploy-infra-cloudwatch.yml
  - Applies cloudwatch agent configs
  - Supports target: backend|bot|all

### 5) Recommended rollout order

Per phase (beta or prod):

1. deploy-infra-nginx
2. deploy-infra-pm2 (target all)
3. deploy-infra-cloudwatch (target all)
4. deploy-python
5. deploy-python-backend
6. deploy-python-bot
7. deploy-frontend

## Security Notes

- Do not commit real credentials or production instance IDs.
- Keep secrets only in GitHub Secrets.
- Keep DEPLOY_MAP in GitHub Variables.
- Use example files only as templates.
