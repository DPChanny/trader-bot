import logging
from collections.abc import AsyncGenerator
from typing import Any

import aioboto3
from botocore.exceptions import ClientError

from shared.env import (
    get_aws_access_key,
    get_aws_bucket_name,
    get_aws_region,
    get_aws_secret_key,
)


logger = logging.getLogger(__name__)

_session = aioboto3.Session(
    aws_access_key_id=get_aws_access_key(),
    aws_secret_access_key=get_aws_secret_key(),
    region_name=get_aws_region(),
)
_bucket_name = get_aws_bucket_name()


async def get_bucket() -> AsyncGenerator[Any, None]:
    async with _session.client("s3") as client:
        yield client


async def upload_discord_profile(bucket: Any, user_id: int, image_data: bytes) -> bool:
    key = f"discord_profiles/{user_id}.png"
    try:
        await bucket.put_object(
            Bucket=_bucket_name, Key=key, Body=image_data, ContentType="image/png"
        )
        logger.info(f"Uploaded: {key}")
        return True
    except ClientError as e:
        logger.error(f"Upload failed {key}: {e}")
        return False
    except Exception as e:
        logger.error(f"Upload error {key}: {e}")
        return False


async def delete_discord_profile(bucket: Any, user_id: int) -> bool:
    key = f"discord_profiles/{user_id}.png"
    try:
        await bucket.delete_object(Bucket=_bucket_name, Key=key)
        logger.info(f"Deleted: {key}")
        return True
    except ClientError as e:
        logger.error(f"Delete failed {key}: {e}")
        return False
    except Exception as e:
        logger.error(f"Delete error {key}: {e}")
        return False
