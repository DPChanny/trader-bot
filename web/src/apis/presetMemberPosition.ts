import type {
  AddPresetMemberPositionDTO,
  PresetMemberPositionDTO,
} from "@dtos/presetMemberPosition";
import { toCamelCase, toSnakeCase } from "@utils/dto";
import { getPresetMemberPositionEndpoint } from "@utils/env";
import { handleHttpError } from "@utils/error";
import { getAuthHeader, getJsonHeader, getHeaders } from "@utils/api";

export async function createPresetMemberPosition({
  guildId,
  presetId,
  presetMemberId,
  dto,
}: {
  guildId: string;
  presetId: number;
  presetMemberId: number;
  dto: AddPresetMemberPositionDTO;
}): Promise<PresetMemberPositionDTO> {
  const response = await fetch(
    getPresetMemberPositionEndpoint(guildId, presetId, presetMemberId),
    {
      method: "POST",
      headers: getHeaders(getAuthHeader(), getJsonHeader()),
      body: JSON.stringify(toSnakeCase(dto)),
    },
  );
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PresetMemberPositionDTO>(json);
}

export async function deletePresetMemberPosition({
  guildId,
  presetId,
  presetMemberId,
  presetMemberPositionId,
}: {
  guildId: string;
  presetId: number;
  presetMemberId: number;
  presetMemberPositionId: number;
}): Promise<void> {
  const response = await fetch(
    `${getPresetMemberPositionEndpoint(guildId, presetId, presetMemberId)}/${presetMemberPositionId}`,
    {
      method: "DELETE",
      headers: getHeaders(getAuthHeader(), getJsonHeader()),
    },
  );
  if (!response.ok) await handleHttpError(response);
}
