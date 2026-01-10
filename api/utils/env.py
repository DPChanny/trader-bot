import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()


def get_app_host() -> str:
    return os.getenv("APP_HOST", "localhost")


def get_app_port() -> int:
    return int(os.getenv("APP_PORT", "8080"))


def get_api_host() -> str:
    return os.getenv("API_HOST", "localhost")


def get_api_port() -> int:
    return int(os.getenv("API_PORT", "8000"))


def get_db_host() -> str:
    return os.getenv("DB_HOST", "localhost")


def get_db_port() -> int:
    return int(os.getenv("DB_PORT", "3306"))


def get_db_user() -> str:
    return os.getenv("DB_USER", "root")


def get_db_password() -> str:
    return os.getenv("DB_PASSWORD", "")


def get_db_name() -> str:
    return os.getenv("DB_NAME", "trader")


def get_db_url() -> str:
    user = get_db_user()
    password = get_db_password()
    host = get_db_host()
    port = get_db_port()
    name = get_db_name()
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset=utf8mb4"


def get_discord_bot_token() -> str:
    return os.getenv("DISCORD_BOT_TOKEN", "")


def get_auction_url(token: str) -> str:
    return (
        f"http://{get_app_host()}:{get_app_port()}/auction.html?token={token}"
    )


def get_profile_url(discord_id: str) -> str:
    return f"http://{get_api_host()}:{get_api_port()}/profiles/{discord_id}.png"


def get_profile_dir() -> Path:
    profile_dir = Path(tempfile.gettempdir()) / "profiles"
    profile_dir.mkdir(exist_ok=True)
    return profile_dir


def get_profile_path(discord_id: str) -> Path:
    return get_profile_dir() / f"{discord_id}.png"


def get_admin_password() -> str:
    return os.getenv("ADMIN_PASSWORD", "admin")


def get_jwt_secret() -> str:
    return os.getenv("JWT_SECRET", "jwt-secret")
