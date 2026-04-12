import { useQuery } from "@tanstack/preact-query";
import type { GuildDTO } from "@/dtos/guildDto";
import { getGuild, getGuilds } from "@/apis/guild";

export function useGuilds() {
  return useQuery({
    queryKey: ["guilds"],
    queryFn: (): Promise<GuildDTO[]> => getGuilds(),
  });
}

export function useGuild(guildId: string) {
  return useQuery({
    queryKey: ["guild", guildId],
    queryFn: (): Promise<GuildDTO> => getGuild(guildId),
  });
}
