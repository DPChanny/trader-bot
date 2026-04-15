import type { GuildDetailDTO } from "@dtos/guild";
import { GUILD_API_ENDPOINT } from "@utils/env";
import { toCamelCase } from "@utils/dto";
import { handleHttpError } from "@utils/error";
import { getAuthHeader, getHeaders } from "@utils/api";

export async function getGuilds(): Promise<GuildDetailDTO[]> {
  const response = await fetch(GUILD_API_ENDPOINT, {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<GuildDetailDTO[]>(json);
}

export async function getGuild(guildId: string): Promise<GuildDetailDTO> {
  const response = await fetch(`${GUILD_API_ENDPOINT}/${guildId}`, {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<GuildDetailDTO>(json);
}
