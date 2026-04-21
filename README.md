# trader-bot

Monorepo for the Discord auction tool stack:

- Frontend app: frontend/
- API server: python/backend/
- Discord bot: python/bot/
- Shared domain and data layer: python/shared/
- Infra assets: infra/

## 1) Workflow

### Local development workflow

Recommended order:

1. Start frontend, backend, and bot in parallel.
2. Use the frontend on http://127.0.0.1:5173.
3. Confirm API health on http://127.0.0.1:8000/health.
4. Iterate on backend/bot code and validate logs.

VS Code tasks are already defined in .vscode/tasks.json:

- Run Frontend Dev
- Run Backend Dev
- Run Bot Dev
- Run All Dev (runs all three in parallel)

Equivalent terminal commands:

- Frontend: cd frontend && npm run dev
- Backend: cd python && uv run python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
- Bot: cd python && uv run python -m bot.main

### CI/CD workflow

All GitHub Actions workflows follow the same pattern:

1. Credential or Checkout
2. Prepare
3. Validate
4. Run

This keeps runtime steps clean and fails fast when required values are missing.

Workflow map:

- Frontend distribute: .github/workflows/frontend-distribute.yml
  Trigger: push tag v\* or manual
  Result: build frontend and sync to S3
- Frontend public distribute: .github/workflows/frontend-public-distribute.yml
  Trigger: changes in frontend/public/\*\* or manual
  Result: build frontend and sync to S3
- Frontend invalidate: .github/workflows/frontend-invalidate.yml
  Trigger: after frontend distribute workflows
  Result: CloudFront invalidation
- Python env: .github/workflows/python-distribute.yml
  Trigger: push tag v\* or manual
  Result: write python/.env on target EC2 instances via SSM
- Python backend deploy: .github/workflows/python-backend.yml
  Trigger: after python-distribute success or manual
  Result: checkout ref, uv sync --frozen, pm2 reload backend
- Python bot deploy: .github/workflows/python-bot.yml
  Trigger: after python-distribute success or manual
  Result: checkout ref, uv sync --frozen, pm2 reload bot
- Infra nginx: .github/workflows/infra-nginx.yml
  Trigger: infra/nginx/\*\* changes or manual
  Result: install nginx config and reload nginx
- Infra cloudwatch: .github/workflows/infra-cloudwatch.yml
  Trigger: infra/cloudwatch/\*\* changes or manual
  Result: update CloudWatch agent config for backend/bot/all
- Infra pm2: .github/workflows/infra-pm2.yml
  Trigger: infra/pm2/\*\* changes or manual
  Result: update pm2 ecosystem and restart pm2 services

## 2) Development environment

### Required tools

- Node.js 24.x (CI uses Node 24)
- npm
- Python 3.12+
- uv (Python package/dependency runner)

Optional but commonly needed:

- AWS CLI (for deployment-related checks)
- PM2 (mainly on server hosts, not required for local app coding)

### Quick setup

1. Install frontend dependencies.

- cd frontend
- npm ci

2. Install Python dependencies.
   - cd ../python
   - uv sync
3. Create runtime env files.
   - python/.env (from python/.env.example)

- frontend/.env.local (for local frontend variables)

4. Start dev tasks.
   - Run All Dev in VS Code, or run each command manually.

## 3) Environment variables

### Python runtime env (python/.env)

Source of truth: python/.env.example

Required in most environments:

- DISCORD_BOT_TOKEN
- DISCORD_CLIENT_ID
- DISCORD_CLIENT_SECRET
- JWT_SECRET

Common defaults and behavior:

- PHASE (default: dev, allowed: dev|beta|prod)
- APP_ORIGIN (default: http://127.0.0.1:5173)
- API_ORIGIN (default: http://127.0.0.1:8000)
- JWT_ALGORITHM (default: HS256)
- RDS_INSTANCE_ID (required)
- RDS_REGION (default: ap-northeast-2)
- DB_HOST (default: 127.0.0.1)
- DB_PORT (default: 5432)
- DB_USER (default: trader)
- DB_NAME (default: trader)
- LOG_LEVEL (default: INFO)
- LOG_TEXT (default: false)
- LOG_FILE (default: true)

Database note:

- PHASE=dev uses local Postgres directly with no password (trust/local auth).
- PHASE=beta|prod resolves RDS endpoint and generates IAM auth token at runtime in python/shared/utils/db.py.

### Frontend env (frontend/.env.local)

Used from frontend/src/utils/env.ts:

- VITE_PHASE (optional, default: dev)
- VITE_API_ORIGIN (optional, default: http://127.0.0.1:8000)
- VITE_DISCORD_CLIENT_ID (required for bot invite URL)
- VITE_GUILD_INVITE_URL (used for footer invite link)

Example:

VITE_PHASE=dev
VITE_API_ORIGIN=http://127.0.0.1:8000
VITE_DISCORD_CLIENT_ID=123456789012345678
VITE_GUILD_INVITE_URL=https://discord.gg/your-invite

### GitHub Actions repository variables

Configured in GitHub repository settings:

- AWS_REGION
- NGINX_INSTANCE_ID
- CLOUDWATCH_INSTANCE_ID
- PM2_INSTANCE_ID
- DISCORD_CLIENT_ID
- RDS_INSTANCE_ID
- DOMAIN
- GUILD_INVITE_URL
- S3_BUCKET_NAME
- CLOUDFRONT_DISTRIBUTION_ID

### GitHub Actions repository secrets

- AWS_ACCESS_KEY_ID
- AWS_ACCESS_KEY_SECRET
- DISCORD_BOT_TOKEN
- DISCORD_CLIENT_SECRET
- JWT_SECRET

## 4) Operational notes

- Nginx proxies /api/ to 127.0.0.1:8000 via infra/nginx/sites-avaliable/trader-bot.conf.
- PM2 process definitions live in infra/pm2/ecosystem.config.mjs.
- CloudWatch log configs live under infra/cloudwatch/amazon-cloudwatch-agent.d/.

## 5) Contact

For project questions or bug reports, use the GitHub issue tracker.
