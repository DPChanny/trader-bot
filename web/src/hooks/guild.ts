import { useQuery } from "@tanstack/preact-query";
import type { GuildDTO } from "@/dtos/guildDto";
import { getGuild, getGuilds } from "@/apis/guild";
import { queryKeys } from "@/utils/query";

export function useGuilds() {
  return useQuery({
    queryKey: queryKeys.guilds(),
    queryFn: (): Promise<GuildDTO[]> => getGuilds(),
  });
}

export function useGuild(guildId: string) {
  return useQuery({
    queryKey: queryKeys.guild(guildId),
    queryFn: (): Promise<GuildDTO> => getGuild(guildId),
  });
}
