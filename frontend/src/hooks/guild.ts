import { useQuery, type UseQueryResult } from "@tanstack/preact-query";
import type { GuildDetailDTO } from "@dtos/guild";
import { getGuild, getGuilds } from "@apis/guild";
import { queryKeys } from "@utils/query";
import type { AppError } from "@utils/error";

export function useGuilds(): UseQueryResult<GuildDetailDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.guilds(),
    queryFn: (): Promise<GuildDetailDTO[]> => getGuilds(),
  });
}

export function useGuild(
  guildId: string,
): UseQueryResult<GuildDetailDTO, AppError> {
  return useQuery({
    queryKey: queryKeys.guild(guildId),
    queryFn: (): Promise<GuildDetailDTO> => getGuild(guildId),
  });
}
