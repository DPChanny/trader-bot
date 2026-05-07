import base64

import httpx

from shared.utils.env import get_toss_secret
from shared.utils.error import HTTPError, UnexpectedErrorCode


_TOSS_API_URL = "https://api.tosspayments.com"


def _get_authorization_header() -> str:
    secret_key = get_toss_secret()
    encoded = base64.b64encode(f"{secret_key}:".encode()).decode()
    return f"Basic {encoded}"


async def issue_billing_key(auth_key: str, customer_key: str) -> tuple[str, str]:
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
        data = response.json()
        billing_key = data["billingKey"]
        card = data.get("card") or {}
        card_type = card.get("cardType") or ""
        number = card.get("number") or ""
        name = f"{card_type} {number}".strip() if number else card_type
        return billing_key, name


async def charge_billing_key(
    billing_key: str, customer_key: str, order_id: str, amount: int, order_name: str
) -> tuple[str, int]:
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
        data = response.json()
        return data["paymentKey"], data["totalAmount"]


async def delete_billing_key(billing_key: str) -> None:
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{_TOSS_API_URL}/v1/billing/{billing_key}",
            headers={"Authorization": _get_authorization_header()},
        )
        if response.status_code != 200:
            raise HTTPError(UnexpectedErrorCode.External)
