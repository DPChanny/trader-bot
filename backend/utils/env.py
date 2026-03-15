import os

from dotenv import load_dotenv


load_dotenv()


def get_app_endpoint() -> str:
    return os.getenv("APP_ENDPOINT", "localhost:8080")


def get_db_endpoint() -> str:
    return os.getenv("DB_ENDPOINT", "localhost:5432")


def get_db_user() -> str:
    return os.getenv("DB_USER", "")


def get_db_password() -> str:
    return os.getenv("DB_PASSWORD", "")


def get_db_name() -> str:
    return os.getenv("DB_NAME", "trader")


def get_db_url() -> str:
    user = get_db_user()
    password = get_db_password()
    endpoint = get_db_endpoint()
    name = get_db_name()

    return f"postgresql://{user}:{password}@{endpoint}/{name}"


def get_discord_bot_token() -> str:
    return os.getenv("DISCORD_BOT_TOKEN", "")


def get_auction_url(token: str) -> str:
    return f"http://{get_app_endpoint()}/auction?token={token}"


def get_admin_password() -> str:
    return os.getenv("ADMIN_PASSWORD", "")


def get_jwt_secret() -> str:
    return os.getenv("JWT_SECRET", "")


def get_jwt_algorithm() -> str:
    return os.getenv("JWT_ALGORITHM", "HS256")


def get_aws_access_key() -> str:
    return os.getenv("AWS_ACCESS_KEY", "")


def get_aws_secret_key() -> str:
    return os.getenv("AWS_SECRET_KEY", "")


def get_aws_region() -> str:
    return os.getenv("AWS_REGION", "")


def get_aws_bucket_name() -> str:
    return os.getenv("AWS_BUCKET_NAME", "")


def get_discord_profile_url(user_id: int) -> str:
    bucket = get_aws_bucket_name()
    region = get_aws_region()
    return f"https://{bucket}.s3.{region}.amazonaws.com/discord_profiles/{user_id}.png"
