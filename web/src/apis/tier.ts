import type { AddTierDTO, TierDTO, UpdateTierDTO } from "@dtos/tier";
import { toCamelCase, toSnakeCase } from "@utils/dto";
import { getTierEndpoint } from "@utils/env";
import { handleHttpError } from "@utils/error";
import { getAuthHeader, getJsonHeader, getHeaders } from "@utils/api";

export async function getTiers(
  guildId: string,
  presetId: number,
): Promise<TierDTO[]> {
  const response = await fetch(getTierEndpoint(guildId, presetId), {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<TierDTO[]>(json);
}

export async function getTier(
  guildId: string,
  presetId: number,
  tierId: number,
): Promise<TierDTO> {
  const response = await fetch(
    `${getTierEndpoint(guildId, presetId)}/${tierId}`,
    { headers: getHeaders(getAuthHeader()) },
  );
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<TierDTO>(json);
}

export async function addTier({
  guildId,
  presetId,
  dto,
}: {
  guildId: string;
  presetId: number;
  dto: AddTierDTO;
}): Promise<TierDTO> {
  const response = await fetch(getTierEndpoint(guildId, presetId), {
    method: "POST",
    headers: getHeaders(getAuthHeader(), getJsonHeader()),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<TierDTO>(json);
}

export async function updateTier({
  guildId,
  presetId,
  tierId,
  dto,
}: {
  guildId: string;
  presetId: number;
  tierId: number;
  dto: UpdateTierDTO;
}): Promise<TierDTO> {
  const response = await fetch(
    `${getTierEndpoint(guildId, presetId)}/${tierId}`,
    {
      method: "PATCH",
      headers: getHeaders(getAuthHeader(), getJsonHeader()),
      body: JSON.stringify(toSnakeCase(dto)),
    },
  );
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<TierDTO>(json);
}

export async function deleteTier({
  guildId,
  presetId,
  tierId,
}: {
  guildId: string;
  presetId: number;
  tierId: number;
}): Promise<void> {
  const response = await fetch(
    `${getTierEndpoint(guildId, presetId)}/${tierId}`,
    {
      method: "DELETE",
      headers: getHeaders(getAuthHeader(), getJsonHeader()),
    },
  );
  if (!response.ok) await handleHttpError(response);
}
