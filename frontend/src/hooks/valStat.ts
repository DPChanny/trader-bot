import { useQuery } from "@tanstack/preact-query";
import type { ValStatDTO } from "@/dto";
import { VAL_STAT_API_ENDPOINT } from "@/env";
import { getAuthHeaders } from "@/utils/auth";
import { toCamelCase } from "@/utils/dto";
import { throwHttpError } from "@/utils/fetch";

export function useValStat(memberId: number | null) {
  return useQuery({
    queryKey: ["val", memberId],
    queryFn: async (): Promise<ValStatDTO | null> => {
      if (!memberId) return null;
      try {
        const response = await fetch(`${VAL_STAT_API_ENDPOINT}/${memberId}`, {
          headers: getAuthHeaders(),
        });
        if (!response.ok) {
          if (response.status === 404) return null;
          await throwHttpError(response);
        }
        const json = await response.json();
        return toCamelCase<ValStatDTO>(json) ?? null;
      } catch (error) {
        if (error instanceof Error) throw error;
        console.error("Error fetching VAL info:", error);
        return null;
      }
    },
    enabled: !!memberId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
