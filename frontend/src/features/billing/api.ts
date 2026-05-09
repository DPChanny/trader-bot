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

export async function requestBilling({
  customerKey,
}: {
  customerKey: string;
}): Promise<BillingDTO> {
  const callbackUrl = `${window.location.origin}/auth/billing/callback`;
  sessionStorage.setItem("billingAuthRedirect", window.location.pathname);

  const tossPayments = await loadTossPayments(TOSS_CLIENT_KEY);
  const payment = tossPayments.payment({ customerKey });

  return new Promise<BillingDTO>((resolve, reject) => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data as {
        type?: string;
        billing?: BillingDTO;
      } | null;
      if (data?.type === "BILLING_AUTH_SUCCESS") {
        window.removeEventListener("message", handleMessage);
        resolve(data.billing!);
      } else if (
        data?.type === "BILLING_AUTH_CANCELED" ||
        data?.type === "BILLING_AUTH_ERROR"
      ) {
        window.removeEventListener("message", handleMessage);
        reject(null);
      }
    };

    window.addEventListener("message", handleMessage);

    payment
      .requestBillingAuth({
        method: "CARD",
        successUrl: callbackUrl,
        failUrl: callbackUrl,
      })
      .catch((e: unknown) => {
        window.removeEventListener("message", handleMessage);
        if (
          e != null &&
          typeof e === "object" &&
          (("code" in e && e.code === "PAY_PROCESS_CANCELED") ||
            ("message" in e &&
              typeof e.message === "string" &&
              e.message.includes("취소")))
        ) {
          reject(null);
          return;
        }
        reject(e);
      });
  });
}
