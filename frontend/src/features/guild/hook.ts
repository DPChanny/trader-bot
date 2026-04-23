import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { GuildDetailDTO } from "@features/guild/dto";
import type { AppError } from "@utils/error";
import { queryKeys } from "@utils/query";
import { getGuild, getGuilds } from "./api";

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

