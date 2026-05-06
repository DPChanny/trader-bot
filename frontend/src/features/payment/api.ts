import type { PaymentDTO } from "@features/payment/dto";
import { getPaymentEndpoint } from "@utils/env";
import { toCamelCase } from "@utils/dto";
import { handleHTTPError } from "@utils/error";
import { getAuthHeader, getHeaders } from "@utils/api";

export async function getPayments(guildId: string): Promise<PaymentDTO[]> {
  const response = await fetch(getPaymentEndpoint(guildId), {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<PaymentDTO[]>(json);
}
