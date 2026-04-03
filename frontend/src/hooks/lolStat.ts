import { useQuery } from "@tanstack/preact-query";
import type { LolStatDTO } from "@/dtos";
import { getAuthHeaders } from "@/utils/auth";
import { LOL_STAT_API_ENDPOINT } from "@/utils/endpoint";
import { toCamelCase } from "@/utils/dto";
import { handleHttpError } from "@/utils/hook";

export function useLolStat(memberId: number | null) {
  return useQuery({
    queryKey: ["lol", memberId],
    queryFn: async (): Promise<LolStatDTO | null> => {
      if (!memberId) return null;
      try {
        const response = await fetch(`${LOL_STAT_API_ENDPOINT}/${memberId}`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          if (response.status === 404) return null;
          await handleHttpError(response);
        }
        const json = await response.json();
        return toCamelCase<LolStatDTO>(json) ?? null;
      } catch (error) {
        if (error instanceof Error) throw error;
        console.error("Error fetching LOL info:", error);
        return null;
      }
    },
    enabled: !!memberId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
