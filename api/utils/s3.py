import asyncio
import logging
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from .env import (
    get_aws_access_key,
    get_aws_secret_key,
    get_aws_region,
    get_aws_bucket_name,
)

logger = logging.getLogger(__name__)


class S3Client:
    def __init__(self):
        self.client = None
        self.bucket_name = get_aws_bucket_name()
        self._init_client()

    def _init_client(self):
        try:
            access_key = get_aws_access_key()
            secret_key = get_aws_secret_key()
            region = get_aws_region()

            if access_key and secret_key:
                self.client = boto3.client(
                    "s3",
                    aws_access_key_id=access_key,
                    aws_secret_access_key=secret_key,
                    region_name=region,
                )
                logger.info("S3 client initialized")
            else:
                logger.warning(
                    "AWS credentials missing - S3 operations will fail"
                )
        except Exception as e:
            logger.error(f"Failed to initialize S3 client: {e}")

    async def upload_discord_profile(
        self, user_id: int, image_data: bytes
    ) -> bool:
        """Async version of upload_discord_profile"""
        if not self.client:
            logger.error("S3 client not initialized")
            return False

        try:
            key = f"discord_profiles/{user_id}.png"
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.client.put_object(
                    Bucket=self.bucket_name,
                    Key=key,
                    Body=image_data,
                    ContentType="image/png",
                ),
            )
            logger.info(f"Discord profile uploaded to S3: {key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to upload discord profile to S3: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error uploading discord profile: {e}")
            return False

    async def delete_discord_profile(self, user_id: int) -> bool:
        """Async version of delete_discord_profile"""
        if not self.client:
            logger.error("S3 client not initialized")
            return False

        try:
            key = f"discord_profiles/{user_id}.png"
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,
                lambda: self.client.delete_object(
                    Bucket=self.bucket_name, Key=key
                ),
            )
            logger.info(f"Discord profile deleted from S3: {key}")
            return True
        except ClientError as e:
            logger.error(f"Failed to delete discord profile from S3: {e}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error deleting discord profile: {e}")
            return False


s3_client = S3Client()
