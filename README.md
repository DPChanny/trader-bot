# Trader Bot Monorepo

## Workflow Structure and CI/CD Standards

This repository uses a unified GitHub Actions workflow structure for all CI/CD pipelines. The standard step order for all workflows is:

1. **Checkout/Credential**: Checkout code and set up credentials.
2. **Prepare**: Gather and output all required environment variables and configuration values.
3. **Validate**: Validate the outputs from the Prepare step. Fail fast if any required value is missing or invalid.
4. **Run**: Execute the main action (build, deploy, etc.) using only validated outputs.

### Key Principles

- **Separation of Concerns**: Each step has a single responsibility. Validation logic is always in the `Validate` step.
- **Fail Fast**: Workflows fail early if required environment variables or secrets are missing.
- **Output Passing**: Use `GITHUB_OUTPUT` to pass values from `Prepare` to `Validate` and `Run`.
- **Concurrency Groups**: All workflows use concurrency groups to prevent race conditions and duplicate executions.
- **Consistent Naming**: Workflow, job, and step names follow a clear, direct naming convention.

### Example Step Order

```yaml
jobs:
  example-job:
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Credentials
        ...
      - name: Prepare
        id: prepare
        run: |
          # Output env vars
          echo "FOO=bar" >> $GITHUB_OUTPUT
      - name: Validate
        run: |
          if [ -z "${{ steps.prepare.outputs.FOO }}" ]; then
            echo "FOO is required" >&2
            exit 1
          fi
      - name: Run
        run: |
          echo "Running with FOO=${{ steps.prepare.outputs.FOO }}"
```

### Directory Structure

- `node/` (or `vite/`): Frontend source code and build scripts
- `python/`: Backend, bot, and shared Python code
- `infra/`: Infrastructure configuration (nginx, cloudwatch, pm2)
- `.github/workflows/`: All CI/CD workflow files

### Naming Conventions

- Frontend workflows: `frontend-distribute.yml`, `frontend-public-distribute.yml`, `frontend-invalidate.yml`
- Backend workflows: `python-backend.yml`, `python-bot.yml`, `python-env.yml`
- Infra workflows: `infra-nginx.yml`, `infra-cloudwatch.yml`, `infra-pm2.yml`

### Best Practices

- Always add new workflows using the `Prepare -> Validate -> Run` structure.
- Keep environment variable validation logic in the `Validate` step.
- Use outputs from `Prepare` in both `Validate` and `Run`.
- Document any new conventions or changes in this README.

## GitHub Actions Variables and Secrets

This section documents repository-level GitHub Actions Variables and Secrets used by workflow runs.

### Repository Variables

**Global variables:**

- `AWS_REGION`: AWS region used by all workflows
- `NGINX_INSTANCE_ID`: Default instance id for nginx workflow (supports multiple ids via input)
- `CLOUDWATCH_INSTANCE_ID`: Default instance id for cloudwatch workflow (supports multiple ids via input)
- `PM2_INSTANCE_ID`: Default instance id for pm2 workflow (supports multiple ids via input)
- `DISCORD_CLIENT_ID`: Discord client id used by python env generation and frontend build
- `RDS_INSTANCE_ID`: RDS identifier injected into python env
- `DOMAIN`: App domain/host used to compose origins
- `GUILD_INVITE_URL`: Guild invite url injected into frontend build env
- `S3_BUCKET_NAME`: S3 bucket for frontend static sync
- `CLOUDFRONT_DISTRIBUTION_ID`: Distribution id for invalidation

### Repository Secrets

These remain shared across namespaces:

- `AWS_ACCESS_KEY_ID`
- `AWS_ACCESS_KEY_SECRET`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_SECRET`
- `JWT_SECRET`

#### Instance ID Usage

- Backend runtime run depends on infra instance targets (`NGINX_INSTANCE_ID`, `CLOUDWATCH_INSTANCE_ID`, `PM2_INSTANCE_ID`).
- Bot runtime run and python env run depend on (`CLOUDWATCH_INSTANCE_ID`, `PM2_INSTANCE_ID`) and do not require `NGINX_INSTANCE_ID`.
- `python-env`, `python-backend`, and `python-bot` deduplicate instance ids and apply once per unique target.
- Workflow concurrency groups are aligned to workflow file names (for example: `python-env`, `python-backend`, `python-bot`).

### Setup Checklist

1. Open repository settings.
2. Go to Secrets and variables, Actions.
3. Create all global variables listed above.
4. Confirm required secrets exist.
5. Run representative workflows to validate:
   - `python-env`
   - `frontend-build`
   - `infra-nginx`

### Infra Dispatch Rules

- `infra-cloudwatch` and `infra-pm2` use unified `workflow_dispatch` input `target` (`backend`, `bot`, `all`).
- Both workflows auto-compose target instance ids, and exclude `NGINX_INSTANCE_ID` when `target=bot`.
- `infra-nginx` is fixed to backend behavior (no `target` input), because bot has no nginx dependency.
- Infra workflows auto-run on path changes:
  - `infra-nginx`: `infra/nginx/**`
  - `infra-cloudwatch`: `infra/cloudwatch/**`
  - `infra-pm2`: `infra/pm2/**`
- For auto-runs, cloudwatch and pm2 execute with `target=all` by default.

---

_Last updated: 2026-04-21_
