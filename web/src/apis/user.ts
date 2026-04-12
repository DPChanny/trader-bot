import type { UserDetailDTO } from "@/dtos/userDto";
import { getAccessToken } from "@/utils/auth";
import { USER_API_ENDPOINT } from "@/utils/env";
import { toCamelCase } from "@/utils/dto";
import { handleHttpError, getAuthHeader, getHeaders } from "@/utils/api";

export async function getMyUser(): Promise<UserDetailDTO | null> {
  if (!getAccessToken()) return null;

  const response = await fetch(`${USER_API_ENDPOINT}/@me`, {
    headers: getHeaders(getAuthHeader()),
  });
  if (response.status === 401) return null;
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<UserDetailDTO>(json);
}
