from collections.abc import AsyncGenerator
from typing import Any

import aioboto3
from loguru import logger

from shared.utils.env import (
    get_aws_access_key,
    get_aws_bucket_name,
    get_aws_region,
    get_aws_secret_key,
    get_profile_key,
)


_session = aioboto3.Session(
    aws_access_key_id=get_aws_access_key(),
    aws_secret_access_key=get_aws_secret_key(),
    region_name=get_aws_region(),
)
_bucket_name = get_aws_bucket_name()


async def get_bucket() -> AsyncGenerator[Any, None]:
    async with _session.client("s3") as bucket:
        yield bucket


async def upload_profile(bucket: Any, user_id: int, profile: bytes) -> None:
    key = get_profile_key(user_id)
    await bucket.put_object(
        Bucket=_bucket_name, Key=key, Body=profile, ContentType="image/png"
    )
    logger.info(f"Profile uploaded: key={key}")


async def delete_profile(bucket: Any, user_id: int) -> None:
    key = get_profile_key(user_id)
    await bucket.delete_object(Bucket=_bucket_name, Key=key)
    logger.info(f"Profile deleted: key={key}")
