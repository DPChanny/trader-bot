import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).parent.parent.parent / ".env")


def get_discord_bot_token() -> str:
    return os.getenv("DISCORD_BOT_TOKEN", "")


def get_discord_client_id() -> str:
    return os.getenv("DISCORD_CLIENT_ID", "")


def get_discord_client_secret() -> str:
    return os.getenv("DISCORD_CLIENT_SECRET", "")


def get_app_origin() -> str:
    return os.getenv("APP_ORIGIN", "http://localhost:5173")


def get_api_origin() -> str:
    return os.getenv("API_ORIGIN", "http://localhost:8000")


def get_jwt_secret() -> str:
    return os.getenv("JWT_SECRET", "")


def get_jwt_algorithm() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")


def get_db_host() -> str:
    return os.getenv("DB_HOST", "")


def get_db_port() -> str:
    return os.getenv("DB_PORT", "5432")


def get_db_user() -> str:
    return os.getenv("DB_USER", "trader")


def get_db_name() -> str:
    return os.getenv("DB_NAME", "trader")


def get_aws_region() -> str:
    return os.getenv("AWS_REGION", "ap-northeast-2")


def get_log_level() -> str:
    return os.getenv("LOG_LEVEL", "INFO")


def get_log_format() -> str:
    return os.getenv("LOG_FORMAT", "text")
