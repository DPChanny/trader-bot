import type {
  PresetDTO,
  AddPresetDTO,
  UpdatePresetDTO,
} from "@/dtos/presetDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getPresetEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export async function getPresets(guildId: string): Promise<PresetDTO[]> {
  const response = await fetch(getPresetEndpoint(guildId), {
    headers: getAuthHeaders(),
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
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PresetDTO>(json);
}

export async function postPreset({
  guildId,
  dto,
}: {
  guildId: string;
  dto: AddPresetDTO;
}): Promise<PresetDTO> {
  const response = await fetch(getPresetEndpoint(guildId), {
    method: "POST",
    headers: getAuthHeadersForMutation(),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PresetDTO>(json);
}

export async function patchPreset({
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
    headers: getAuthHeadersForMutation(),
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
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleHttpError(response);
}
