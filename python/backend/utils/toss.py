import base64
import re

import httpx

from shared.utils.env import get_toss_secret
from shared.utils.error import HTTPError, UnexpectedErrorCode


_TOSS_API_URL = "https://api.tosspayments.com"

_ISSUER_CODE_MAP: dict[str, str] = {
    "11": "국민",
    "15": "카카오뱅크",
    "21": "하나",
    "24": "토스뱅크",
    "30": "산업",
    "31": "BC",
    "33": "우리",
    "34": "수협",
    "35": "전북",
    "36": "씨티",
    "37": "우체국",
    "38": "새마을",
    "39": "저축",
    "3A": "케이뱅크",
    "3C": "유니온페이",
    "3K": "기업비씨",
    "41": "신한",
    "42": "제주",
    "46": "광주",
    "4J": "JCB",
    "4M": "마스터",
    "4V": "VISA",
    "51": "삼성",
    "61": "현대",
    "62": "신협",
    "6D": "다이너스",
    "71": "롯데",
    "7A": "AMEX",
    "91": "농협",
    "W1": "우리",
}


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
        issuer_code = card.get("issuerCode") or ""
        company = _ISSUER_CODE_MAP.get(issuer_code, issuer_code)
        number = card.get("number") or ""
        m = re.search(r"(\d+)\*+$", number)
        last_visible = m.group(1) if m else re.sub(r"\D", "", number)[-4:]
        name = f"{company} {last_visible}".strip() if last_visible else company
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
