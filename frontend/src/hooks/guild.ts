import { useMutation, useQuery } from "@tanstack/preact-query";
import type { Guild } from "@/dto";
import { GUILD_API_ENDPOINT } from "@/env";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase } from "@/utils/dto";
import { throwHttpError } from "@/utils/fetch";

export function useGuilds() {
  return useQuery({
    queryKey: ["guilds"],
    queryFn: async (): Promise<Guild[]> => {
      const response = await fetch(GUILD_API_ENDPOINT, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await throwHttpError(response);
      const json = await response.json();
      return toCamelCase<Guild[]>(json);
    },
  });
}

export function useGuildInviteUrl() {
  return useMutation({
    mutationFn: async (): Promise<{ url: string }> => {
      const response = await fetch(GUILD_API_ENDPOINT, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) await throwHttpError(response);
      return response.json();
    },
  });
}
