import type {
  PositionDTO,
  AddPositionDTO,
  UpdatePositionDTO,
} from "@/dtos/positionDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getPositionEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export async function getPositions(
  guildId: string,
  presetId: number,
): Promise<PositionDTO[]> {
  const response = await fetch(getPositionEndpoint(guildId, presetId), {
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PositionDTO[]>(json);
}

export async function getPosition(
  guildId: string,
  presetId: number,
  positionId: number,
): Promise<PositionDTO> {
  const response = await fetch(
    `${getPositionEndpoint(guildId, presetId)}/${positionId}`,
    {
      headers: getAuthHeaders(),
    },
  );
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PositionDTO>(json);
}

export async function addPosition({
  guildId,
  presetId,
  dto,
}: {
  guildId: string;
  presetId: number;
  dto: AddPositionDTO;
}): Promise<PositionDTO> {
  const response = await fetch(getPositionEndpoint(guildId, presetId), {
    method: "POST",
    headers: getAuthHeadersForMutation(),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PositionDTO>(json);
}

export async function updatePosition({
  guildId,
  presetId,
  positionId,
  dto,
}: {
  guildId: string;
  presetId: number;
  positionId: number;
  dto: UpdatePositionDTO;
}): Promise<PositionDTO> {
  const response = await fetch(
    `${getPositionEndpoint(guildId, presetId)}/${positionId}`,
    {
      method: "PATCH",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(dto)),
    },
  );
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PositionDTO>(json);
}

export async function deletePosition({
  guildId,
  presetId,
  positionId,
}: {
  guildId: string;
  presetId: number;
  positionId: number;
}): Promise<void> {
  const response = await fetch(
    `${getPositionEndpoint(guildId, presetId)}/${positionId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    },
  );
  if (!response.ok) await handleHttpError(response);
}
