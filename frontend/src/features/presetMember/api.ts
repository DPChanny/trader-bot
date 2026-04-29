import type {
  AddPresetMemberDTO,
  PresetMemberDetailDTO,
  UpdatePresetMemberDTO,
} from "@features/presetMember/dto";
import { toCamelCase, toSnakeCase } from "@utils/dto";
import { getPresetMemberEndpoint } from "@utils/env";
import { handleHTTPError } from "@utils/error";
import { getAuthHeader, getJsonHeader, getHeaders } from "@utils/api";

export async function getPresetMembers(
  guildId: string,
  presetId: number,
): Promise<PresetMemberDetailDTO[]> {
  const response = await fetch(getPresetMemberEndpoint(guildId, presetId), {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<PresetMemberDetailDTO[]>(json);
}

export async function getPresetMember(
  guildId: string,
  presetId: number,
  presetMemberId: number,
): Promise<PresetMemberDetailDTO> {
  const response = await fetch(
    `${getPresetMemberEndpoint(guildId, presetId)}/${presetMemberId}`,
    { headers: getHeaders(getAuthHeader()) },
  );
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<PresetMemberDetailDTO>(json);
}

export async function createPresetMember({
  guildId,
  presetId,
  dto,
}: {
  guildId: string;
  presetId: number;
  dto: AddPresetMemberDTO;
}): Promise<PresetMemberDetailDTO> {
  const response = await fetch(getPresetMemberEndpoint(guildId, presetId), {
    method: "POST",
    headers: getHeaders(getAuthHeader(), getJsonHeader()),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<PresetMemberDetailDTO>(json);
}

export async function updatePresetMember({
  guildId,
  presetId,
  presetMemberId,
  dto,
}: {
  guildId: string;
  presetId: number;
  presetMemberId: number;
  dto: UpdatePresetMemberDTO;
}): Promise<PresetMemberDetailDTO> {
  const response = await fetch(
    `${getPresetMemberEndpoint(guildId, presetId)}/${presetMemberId}`,
    {
      method: "PATCH",
      headers: getHeaders(getAuthHeader(), getJsonHeader()),
      body: JSON.stringify(toSnakeCase(dto)),
    },
  );
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<PresetMemberDetailDTO>(json);
}

export async function deletePresetMember({
  guildId,
  presetId,
  presetMemberId,
}: {
  guildId: string;
  presetId: number;
  presetMemberId: number;
}): Promise<void> {
  const response = await fetch(
    `${getPresetMemberEndpoint(guildId, presetId)}/${presetMemberId}`,
    {
      method: "DELETE",
      headers: getHeaders(getAuthHeader()),
    },
  );
  if (!response.ok) await handleHTTPError(response);
}
