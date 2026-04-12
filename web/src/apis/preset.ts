import type {
  PresetDTO,
  CreatePresetDTO,
  UpdatePresetDTO,
} from "@/dtos/presetDto";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getPresetEndpoint } from "@/utils/env";
import {
  handleHttpError,
  getAuthHeader,
  getJsonHeader,
  getHeaders,
} from "@/utils/api";

export async function getPresets(guildId: string): Promise<PresetDTO[]> {
  const response = await fetch(getPresetEndpoint(guildId), {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PresetDTO[]>(json);
}

export async function getPreset(
  guildId: string,
  presetId: number,
): Promise<PresetDTO> {
  const response = await fetch(`${getPresetEndpoint(guildId)}/${presetId}`, {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PresetDTO>(json);
}

export async function createPreset({
  guildId,
  dto,
}: {
  guildId: string;
  dto: CreatePresetDTO;
}): Promise<PresetDTO> {
  const response = await fetch(getPresetEndpoint(guildId), {
    method: "POST",
    headers: getHeaders(getAuthHeader(), getJsonHeader()),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PresetDTO>(json);
}

export async function updatePreset({
  guildId,
  presetId,
  dto,
}: {
  guildId: string;
  presetId: number;
  dto: UpdatePresetDTO;
}): Promise<PresetDTO> {
  const response = await fetch(`${getPresetEndpoint(guildId)}/${presetId}`, {
    method: "PATCH",
    headers: getHeaders(getAuthHeader(), getJsonHeader()),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PresetDTO>(json);
}

export async function deletePreset({
  guildId,
  presetId,
}: {
  guildId: string;
  presetId: number;
}): Promise<void> {
  const response = await fetch(`${getPresetEndpoint(guildId)}/${presetId}`, {
    method: "DELETE",
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHttpError(response);
}
