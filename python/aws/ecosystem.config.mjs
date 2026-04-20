export const apps = [
  {
    name: "trader-bot-prod-pm2-backend",
    cwd: "/var/www/trader-bot/python",
    script: "./.venv/bin/python",
    args: "-m uvicorn backend.main:app --host 127.0.0.1 --port 8000",
    kill_timeout: 3000,
  },
  {
    name: "trader-bot-prod-pm2-bot",
    cwd: "/var/www/trader-bot/python",
    script: "./.venv/bin/python",
    args: "-m bot.main",
    kill_timeout: 3000,
  },
];
