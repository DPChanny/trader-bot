import base64

import httpx

from .env import get_toss_secret
from .error import HTTPError, UnexpectedErrorCode


_TOSS_API_URL = "https://api.tosspayments.com"


def _get_authorization_header() -> str:
    secret_key = get_toss_secret()
    encoded = base64.b64encode(f"{secret_key}:".encode()).decode()
    return f"Basic {encoded}"


async def issue_billing_key(auth_key: str, customer_key: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{_TOSS_API_URL}/v1/billing/authorizations/issue",
            headers={
                "Authorization": _get_authorization_header(),
                "Content-Type": "application/json",
            },
            json={"authKey": auth_key, "customerKey": customer_key},
        )
        if response.status_code != 200:
            raise HTTPError(UnexpectedErrorCode.External)
        return response.json()["billingKey"]


async def charge_billing_key(
    billing_key: str, customer_key: str, order_id: str, amount: int, order_name: str
) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{_TOSS_API_URL}/v1/billing/{billing_key}",
            headers={
                "Authorization": _get_authorization_header(),
                "Content-Type": "application/json",
            },
            json={
                "customerKey": customer_key,
                "orderId": order_id,
                "amount": amount,
                "orderName": order_name,
            },
        )
        if response.status_code != 200:
            raise HTTPError(UnexpectedErrorCode.External)
        return response.json()["paymentKey"]
