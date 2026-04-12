import type {
  AddPresetMemberDTO,
  PresetMemberDetailDTO,
  UpdatePresetMemberDTO,
} from "@/dtos/presetMemberDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getPresetMemberEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export async function getPresetMembers(
  guildId: string,
  presetId: number,
): Promise<PresetMemberDetailDTO[]> {
  const response = await fetch(getPresetMemberEndpoint(guildId, presetId), {
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleHttpError(response);
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
    { headers: getAuthHeaders() },
  );
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PresetMemberDetailDTO>(json);
}

export async function postPresetMember({
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
    headers: getAuthHeadersForMutation(),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<PresetMemberDetailDTO>(json);
}

export async function patchPresetMember({
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
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(dto)),
    },
  );
  if (!response.ok) await handleHttpError(response);
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
      headers: getAuthHeadersForMutation(),
    },
  );
  if (!response.ok) await handleHttpError(response);
}
