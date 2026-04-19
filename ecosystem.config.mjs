export const apps = [
  {
    name: "trader-bot-backend",
    cwd: "/var/www/trader-bot/python",
    script: "./.venv/bin/python",
    args: "-m uvicorn backend.main:app --host localhost --port 8000",
    kill_timeout: 3000,
  },
  {
    name: "trader-bot-bot",
    cwd: "/var/www/trader-bot/python",
    script: "./.venv/bin/python",
    args: "-m bot.main",
    kill_timeout: 3000,
  },
];
