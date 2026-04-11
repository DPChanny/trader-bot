import { useQuery } from "@tanstack/preact-query";
import type { GuildDTO } from "@/dtos/guildDto";
import { getAuthHeaders } from "@/utils/auth";
import { GUILD_API_ENDPOINT } from "@/utils/env";
import { toCamelCase } from "@/utils/dto";
import { handleHttpError } from "@/utils/hook";

export function useGuilds() {
  return useQuery({
    queryKey: ["guilds"],
    queryFn: async (): Promise<GuildDTO[]> => {
      const response = await fetch(GUILD_API_ENDPOINT, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<GuildDTO[]>(json);
    },
  });
}

export function useGuild(guildId: string) {
  return useQuery({
    queryKey: ["guild", guildId],
    queryFn: async (): Promise<GuildDTO> => {
      const response = await fetch(`${GUILD_API_ENDPOINT}/${guildId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<GuildDTO>(json);
    },
  });
}
