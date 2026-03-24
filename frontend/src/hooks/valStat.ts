import { useQuery } from "@tanstack/preact-query";
import type { ValStatDto } from "@/dto";
import { VAL_STAT_API_ENDPOINT } from "@/env";
import { toCamelCase } from "@/utils/dto";
import { throwHttpError } from "@/utils/fetch";

export function useValStat(userId: number | null) {
  return useQuery({
    queryKey: ["val", userId],
    queryFn: async (): Promise<ValStatDto | null> => {
      if (!userId) return null;
      try {
        const response = await fetch(`${VAL_STAT_API_ENDPOINT}/${userId}`);
        if (!response.ok) {
          if (response.status === 404) return null;
          await throwHttpError(response);
        }
        const json = await response.json();
        return toCamelCase<ValStatDto>(json) ?? null;
      } catch (error) {
        if (error instanceof Error) throw error;
        console.error("Error fetching VAL info:", error);
        return null;
      }
    },
    enabled: !!userId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}
