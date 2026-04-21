import os
from pathlib import Path
from secrets import token_hex

from dotenv import load_dotenv


load_dotenv(Path(__file__).parent.parent.parent / ".env")

_jwt_secret = os.getenv("JWT_SECRET") or token_hex(32)


def _get_required_env(key: str) -> str:
    return os.environ[key]


def get_discord_bot_token() -> str:
    return _get_required_env("DISCORD_BOT_TOKEN")


def get_discord_client_id() -> str:
    return _get_required_env("DISCORD_CLIENT_ID")


def get_discord_client_secret() -> str:
    return _get_required_env("DISCORD_CLIENT_SECRET")


def get_app_origin() -> str:
    return os.getenv("APP_ORIGIN", "http://127.0.0.1:5173")


def get_api_origin() -> str:
    return os.getenv("API_ORIGIN", "http://127.0.0.1:8000")


def get_jwt_secret() -> str:
    return _jwt_secret


def get_jwt_algorithm() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")


def get_db_port() -> str:
    return os.getenv("DB_PORT", "5432")


def get_db_user() -> str:
    return os.getenv("DB_USER", "trader")


def get_db_name() -> str:
    return os.getenv("DB_NAME", "trader")


def get_rds_region() -> str:
    return os.getenv("RDS_REGION", "ap-northeast-2")


def get_rds_instance_id() -> str:
    return _get_required_env("RDS_INSTANCE_ID")


def get_log_level() -> str:
    return os.getenv("LOG_LEVEL", "INFO")


def get_log_text() -> bool:
    return os.getenv("LOG_TEXT", "false").lower() == "true"


def get_log_file() -> bool:
    return os.getenv("LOG_FILE", "true").lower() == "true"
