import type { GuildDTO } from "@/dtos/guildDto";
import { GUILD_API_ENDPOINT } from "@/utils/env";
import { toCamelCase } from "@/utils/dto";
import { handleHttpError, getAuthHeader, getHeaders } from "@/utils/api";

export async function getGuilds(): Promise<GuildDTO[]> {
  const response = await fetch(GUILD_API_ENDPOINT, {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<GuildDTO[]>(json);
}

export async function getGuild(guildId: string): Promise<GuildDTO> {
  const response = await fetch(`${GUILD_API_ENDPOINT}/${guildId}`, {
    headers: getHeaders(getAuthHeader()),
  });
  if (!response.ok) await handleHttpError(response);
  const json = await response.json();
  return toCamelCase<GuildDTO>(json);
}
