import type { AddTierDTO, TierDTO, UpdateTierDTO } from "@/dtos/tierDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getTierEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export async function getTiers(
  guildId: string,
  presetId: number,
): Promise<TierDTO[]> {
  const response = await fetch(getTierEndpoint(guildId, presetId), {
    headers: getAuthHeaders(),
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
    { headers: getAuthHeaders() },
  );
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<TierDTO>(json);
}

export async function postTier({
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
    headers: getAuthHeadersForMutation(),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<TierDTO>(json);
}

export async function patchTier({
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
      headers: getAuthHeadersForMutation(),
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
      headers: getAuthHeadersForMutation(),
    },
  );
  if (!response.ok) await handleHttpError(response);
}
