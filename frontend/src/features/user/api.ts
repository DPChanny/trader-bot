import type { UserDetailDTO } from "@features/user/dto";
import type { PaymentDTO } from "@features/payment/dto";
import { USER_API_ENDPOINT } from "@utils/env";
import { toCamelCase } from "@utils/dto";
import { handleHTTPError } from "@utils/error";
import { getAuthHeader, getHeaders } from "@utils/api";
import { getAccessToken } from "@features/auth/token";

export async function getMyUser(): Promise<UserDetailDTO | null> {
  if (!getAccessToken()) return null;

  const response = await fetch(`${USER_API_ENDPOINT}/@me`, {
    headers: getHeaders(getAuthHeader()),
  });
  if (response.status === 401) return null;
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<UserDetailDTO>(json);
}

export async function getMyPayments(): Promise<PaymentDTO[]> {
  const response = await fetch(`${USER_API_ENDPOINT}/@me/payment`, {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<PaymentDTO[]>(json);
}

export async function deleteMyUser(): Promise<void> {
  const response = await fetch(`${USER_API_ENDPOINT}/@me`, {
    method: "DELETE",
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
}
