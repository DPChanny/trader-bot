from collections.abc import AsyncGenerator
from typing import Any

import aioboto3
from botocore.exceptions import ClientError
from loguru import logger

from shared.env import (
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


async def upload_profile(bucket: Any, user_id: int, profile: bytes) -> bool:
    key = get_profile_key(user_id)
    try:
        await bucket.put_object(
            Bucket=_bucket_name, Key=key, Body=profile, ContentType="image/png"
        )
        logger.info(f"S3 upload success: key={key}")
        return True
    except ClientError:
        logger.exception(f"S3 upload failed: key={key}")
        return False
    except Exception:
        logger.exception(f"S3 upload failed: key={key}")
        return False


async def delete_profile(bucket: Any, user_id: int) -> bool:
    key = get_profile_key(user_id)
    try:
        await bucket.delete_object(Bucket=_bucket_name, Key=key)
        logger.info(f"S3 delete success: key={key}")
        return True
    except ClientError:
        logger.exception(f"S3 delete failed: key={key}")
        return False
    except Exception:
        logger.exception(f"S3 delete failed: key={key}")
        return False
