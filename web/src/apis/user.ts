import type { UserDTO } from "@/dtos/userDto";
import { getAuthHeaders, getAccessToken } from "@/utils/auth";
import { USER_API_ENDPOINT } from "@/utils/env";
import { toCamelCase } from "@/utils/dto";
import { handleHttpError } from "@/utils/hook";

export async function getMyUser(): Promise<UserDTO | null> {
  if (!getAccessToken()) return null;

  const response = await fetch(`${USER_API_ENDPOINT}/@me`, {
    headers: getAuthHeaders(),
  });
  if (response.status === 401) return null;
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<UserDTO>(json);
}
