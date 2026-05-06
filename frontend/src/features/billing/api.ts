import { loadTossPayments } from "@tosspayments/tosspayments-sdk";
import type { BillingDTO } from "@features/billing/dto";
import { BILLING_API_ENDPOINT, TOSS_CLIENT_KEY } from "@utils/env";
import { toCamelCase, toSnakeCase } from "@utils/dto";
import { handleHTTPError } from "@utils/error";
import { getAuthHeader, getJsonHeader, getHeaders } from "@utils/api";

export async function getBillings(): Promise<BillingDTO[]> {
  const response = await fetch(BILLING_API_ENDPOINT, {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<BillingDTO[]>(json);
}

export async function registerBilling({
  authKey,
}: {
  authKey: string;
}): Promise<BillingDTO> {
  const response = await fetch(BILLING_API_ENDPOINT, {
    method: "POST",
    headers: getHeaders(getAuthHeader(), getJsonHeader()),
    body: JSON.stringify(toSnakeCase({ authKey })),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<BillingDTO>(json);
}

export async function deleteBilling({
  billingId,
}: {
  billingId: number;
}): Promise<void> {
  const response = await fetch(`${BILLING_API_ENDPOINT}/${billingId}`, {
    method: "DELETE",
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
}

export async function requestBillingAuth({
  customerKey,
  successUrl,
  failUrl,
}: {
  customerKey: string;
  successUrl: string;
  failUrl: string;
}): Promise<void> {
  const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
  const payment = tossPayments.payment({ customerKey });
  await payment.requestBillingAuth({
    method: "CARD",
    successUrl,
    failUrl,
  });
}
