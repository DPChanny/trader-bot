import { useQuery } from "@tanstack/preact-query";
import type { LolStatDto, ApiResponse } from "@/dto";
import { LOL_STAT_API_ENDPOINT } from "@/env";
import { toCamelCase } from "@/utils/dto";

export function useLolStat(userId: number | null) {
  return useQuery({
    queryKey: ["lol", userId],
    queryFn: async (): Promise<LolStatDto | null> => {
      if (!userId) return null;
      try {
        const response = await fetch(`${LOL_STAT_API_ENDPOINT}/${userId}`);
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error("Failed to fetch LOL info");
        }
        const json: ApiResponse<any> = await response.json();
        if (!json.data) return null;
        return toCamelCase<LolStatDto>(json.data) ?? null;
      } catch (error) {
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
