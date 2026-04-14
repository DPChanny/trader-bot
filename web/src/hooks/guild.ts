import { useQuery, type UseQueryResult } from "@tanstack/preact-query";
import type { GuildDetailDTO } from "@/dtos/guild";
import { getGuild, getGuilds } from "@/apis/guild";
import { queryKeys } from "@/utils/query";

export function useGuilds(): UseQueryResult<GuildDetailDTO[], Error> {
  return useQuery({
    queryKey: queryKeys.guilds(),
    queryFn: (): Promise<GuildDetailDTO[]> => getGuilds(),
  });
}

export function useGuild(
  guildId: string,
): UseQueryResult<GuildDetailDTO, Error> {
  return useQuery({
    queryKey: queryKeys.guild(guildId),
    queryFn: (): Promise<GuildDetailDTO> => getGuild(guildId),
  });
}
