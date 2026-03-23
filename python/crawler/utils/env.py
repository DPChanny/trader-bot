import os

from dotenv import load_dotenv

load_dotenv()


def get_db_host() -> str:
    return os.getenv("DB_HOST", "localhost")


def get_db_port() -> int:
    return int(os.getenv("DB_PORT", "3306"))


def get_db_user() -> str:
    return os.getenv("DB_USER", "root")


def get_db_password() -> str:
    return os.getenv("DB_PASSWORD", "")


def get_db_name() -> str:
    return os.getenv("DB_NAME", "trader_crawler")


def get_db_url() -> str:
    user = get_db_user()
    password = get_db_password()
    host = get_db_host()
    port = get_db_port()
    name = get_db_name()
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{name}?charset=utf8mb4"
