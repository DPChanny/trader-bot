import type {
  SubscriptionDTO,
  RegisterSubscriptionDTO,
} from "@features/subscription/dto";
import { getSubscriptionEndpoint } from "@utils/env";
import { toCamelCase, toSnakeCase } from "@utils/dto";
import { handleHTTPError } from "@utils/error";
import { getAuthHeader, getJsonHeader, getHeaders } from "@utils/api";

export async function getSubscription(
  guildId: string,
): Promise<SubscriptionDTO> {
  const response = await fetch(getSubscriptionEndpoint(guildId), {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<SubscriptionDTO>(json);
}

export async function registerSubscription({
  guildId,
  dto,
}: {
  guildId: string;
  dto: RegisterSubscriptionDTO;
}): Promise<SubscriptionDTO> {
  const response = await fetch(getSubscriptionEndpoint(guildId), {
    method: "POST",
    headers: getHeaders(getAuthHeader(), getJsonHeader()),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<SubscriptionDTO>(json);
}

export async function cancelSubscription({
  guildId,
}: {
  guildId: string;
}): Promise<void> {
  const response = await fetch(getSubscriptionEndpoint(guildId), {
    method: "DELETE",
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
}
