import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).parent.parent.parent / ".env")


def get_phase() -> str:
    phase = os.getenv("PHASE", "dev").lower()
    if phase in ("dev", "beta", "prod"):
        return phase
    return "dev"


def get_discord_bot_token() -> str:
    return os.environ["DISCORD_BOT_TOKEN"]


def get_discord_client_id() -> str:
    return os.environ["DISCORD_CLIENT_ID"]


def get_discord_client_secret() -> str:
    return os.environ["DISCORD_CLIENT_SECRET"]


def get_app_origin() -> str:
    return os.getenv("APP_ORIGIN", "http://127.0.0.1:5173")


def get_api_origin() -> str:
    return os.getenv("API_ORIGIN", "http://127.0.0.1:8000")


def get_jwt_secret() -> str:
    return os.getenv(
        "JWT_SECRET", "0000000000000000000000000000000000000000000000000000000000000000"
    )


def get_jwt_algorithm() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")


def get_db_host() -> str:
    return os.getenv("DB_HOST", "127.0.0.1")


def get_db_port() -> str:
    return os.getenv("DB_PORT", "5432")


def get_db_user() -> str:
    return os.getenv("DB_USER", "trader-bot")


def get_db_name() -> str:
    return os.getenv("DB_NAME", "trader-bot")


def get_db_region() -> str:
    return os.getenv("DB_REGION", "ap-northeast-2")


def get_redis_host() -> str:
    return os.getenv("REDIS_HOST", "127.0.0.1")


def get_log_dir() -> Path | None:
    log_dir = os.getenv("LOG_DIR")
    return Path(log_dir) if log_dir else None


def get_redis_port() -> int:
    return int(os.getenv("REDIS_PORT", "6379"))


def get_redis_db() -> int:
    return int(os.getenv("REDIS_DB", "0"))


def get_log_level() -> str:
    return os.getenv("LOG_LEVEL", "INFO")


def get_log_text() -> bool:
    return os.getenv("LOG_TEXT", "false").lower() == "true"


def get_log_file() -> bool:
    return os.getenv("LOG_FILE", "true").lower() == "true"


def get_toss_secret() -> str:
    return os.environ["TOSS_SECRET"]
