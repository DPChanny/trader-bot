import type { MemberDetailDTO, UpdateMemberDTO } from "@/dtos/memberDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getMemberEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export async function getMyMember(guildId: string): Promise<MemberDetailDTO> {
  const response = await fetch(`${getMemberEndpoint(guildId)}/me`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<MemberDetailDTO>(json);
}

export async function getMembers(guildId: string): Promise<MemberDetailDTO[]> {
  const response = await fetch(getMemberEndpoint(guildId), {
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<MemberDetailDTO[]>(json);
}

export async function getMember(
  guildId: string,
  memberId: number,
): Promise<MemberDetailDTO> {
  const response = await fetch(`${getMemberEndpoint(guildId)}/${memberId}`, {
    headers: getAuthHeaders(),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<MemberDetailDTO>(json);
}

export async function patchMember({
  guildId,
  memberId,
  dto,
}: {
  guildId: string;
  memberId: number;
  dto: UpdateMemberDTO;
}): Promise<MemberDetailDTO> {
  const response = await fetch(`${getMemberEndpoint(guildId)}/${memberId}`, {
    method: "PATCH",
    headers: getAuthHeadersForMutation(),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<MemberDetailDTO>(json);
}
