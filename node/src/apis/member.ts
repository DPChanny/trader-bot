import type { MemberDetailDTO, UpdateMemberDTO } from "@dtos/member";
import { toCamelCase, toSnakeCase } from "@utils/dto";
import { getMemberEndpoint } from "@utils/env";
import { handleHTTPError } from "@utils/error";
import { getAuthHeader, getJsonHeader, getHeaders } from "@utils/api";

export async function getMyMember(guildId: string): Promise<MemberDetailDTO> {
  const response = await fetch(`${getMemberEndpoint(guildId)}/me`, {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<MemberDetailDTO>(json);
}

export async function getMembers(guildId: string): Promise<MemberDetailDTO[]> {
  const response = await fetch(getMemberEndpoint(guildId), {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<MemberDetailDTO[]>(json);
}

export async function getMember(
  guildId: string,
  memberId: number,
): Promise<MemberDetailDTO> {
  const response = await fetch(`${getMemberEndpoint(guildId)}/${memberId}`, {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<MemberDetailDTO>(json);
}

export async function updateMember({
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
    headers: getHeaders(getAuthHeader(), getJsonHeader()),
    body: JSON.stringify(toSnakeCase(dto)),
  });
  if (!response.ok) await handleHTTPError(response);
  const json = await response.json();
  return toCamelCase<MemberDetailDTO>(json);
}
