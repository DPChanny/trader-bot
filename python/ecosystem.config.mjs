export const apps = [
  {
    name: "trader-bot-prod-pm2-backend",
    cwd: "/var/www/trader-bot/python",
    script: "uv",
    args: "run python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000",
    interpreter: "none",
    autorestart: true,
    env: {
      PYTHONPATH: ".",
    },
  },
  {
    name: "trader-bot-prod-pm2-bot",
    cwd: "/var/www/trader-bot/python",
    script: "uv",
    args: "run python -m bot.main",
    interpreter: "none",
    autorestart: true,
    env: {
      PYTHONPATH: ".",
    },
  },
];
