import os
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).parent.parent.parent / ".env")


def get_bot_token() -> str:
    return os.getenv("BOT_TOKEN", "")


def get_bot_origin() -> str:
    return os.getenv("BOT_ORIGIN", "http://localhost:8001")


def get_bot_endpoint() -> str:
    return f"{get_bot_origin()}/bot"


def get_discord_client_id() -> str:
    return os.getenv("DISCORD_CLIENT_ID", "")


def get_discord_client_secret() -> str:
    return os.getenv("DISCORD_CLIENT_SECRET", "")


def get_app_origin() -> str:
    return os.getenv("APP_ORIGIN", "http://localhost:5173")


def get_auction_url(token: str) -> str:
    return f"{get_app_origin()}/auction?token={token}"


def get_api_origin() -> str:
    return os.getenv("API_ORIGIN", "http://localhost:8000")


def get_api_endpoint() -> str:
    return f"{get_api_origin()}/api"


def get_jwt_secret() -> str:
    return os.getenv("JWT_SECRET", "")


def get_jwt_algorithm() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")


def get_db_host() -> str:
    return os.getenv("DB_HOST", "")


def get_db_port() -> str:
    return os.getenv("DB_PORT", "5432")


def get_db_user() -> str:
    return os.getenv("DB_USER", "postgres")


def get_db_password() -> str:
    return os.getenv("DB_PASSWORD", "")


def get_db_name() -> str:
    return os.getenv("DB_NAME", "trader")


def get_db_url_netloc() -> str:
    user = get_db_user()
    password = get_db_password()
    host = get_db_host()
    port = get_db_port()
    name = get_db_name()
    return f"{user}:{password}@{host}:{port}/{name}"


def get_sync_db_url() -> str:
    return f"postgresql://{get_db_url_netloc()}"


def get_async_db_url() -> str:
    return f"postgresql+asyncpg://{get_db_url_netloc()}"


def get_aws_access_id() -> str:
    return os.getenv("AWS_ACCESS_ID", "")


def get_aws_access_secret() -> str:
    return os.getenv("AWS_ACCESS_SECRET", "")


def get_aws_region() -> str:
    return os.getenv("AWS_REGION", "ap-northeast-2")


def get_aws_bucket_name() -> str:
    return os.getenv("AWS_BUCKET_NAME", "trader-dev-bucket")


def get_profile_key(user_id: int) -> str:
    return f"profiles/{user_id}"


def get_profile_url(user_id: int) -> str:
    bucket = get_aws_bucket_name()
    region = get_aws_region()
    return f"https://{bucket}.s3.{region}.amazonaws.com/{get_profile_key(user_id)}"


def get_log_level() -> str:
    return os.getenv("LOG_LEVEL", "INFO")


def get_log_format() -> str:
    return os.getenv("LOG_FORMAT", "text")
