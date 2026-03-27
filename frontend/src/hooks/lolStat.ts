import { useQuery } from "@tanstack/preact-query";
import type { LolStatDTO } from "@/dto";
import { LOL_STAT_API_ENDPOINT } from "@/env";
import { toCamelCase } from "@/utils/dto";
import { throwHttpError } from "@/utils/fetch";

export function useLolStat(userId: number | null) {
  return useQuery({
    queryKey: ["lol", userId],
    queryFn: async (): Promise<LolStatDTO | null> => {
      if (!userId) return null;
      try {
        const response = await fetch(`${LOL_STAT_API_ENDPOINT}/${userId}`);
        if (!response.ok) {
          if (response.status === 404) return null;
          await throwHttpError(response);
        }
        const json = await response.json();
        return toCamelCase<LolStatDTO>(json) ?? null;
      } catch (error) {
        if (error instanceof Error) throw error;
        console.error("Error fetching LOL info:", error);
        return null;
      }
    },
    enabled: !!userId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
