import { useQuery } from "@tanstack/preact-query";
import type { ValStatDto } from "@/dto";
import { VAL_STAT_API_ENDPOINT } from "@/env";
import { toCamelCase } from "@/utils/dto";

export function useValStat(userId: number | null) {
  return useQuery({
    queryKey: ["val", userId],
    queryFn: async (): Promise<ValStatDto | null> => {
      if (!userId) return null;
      try {
        const response = await fetch(`${VAL_STAT_API_ENDPOINT}/${userId}`);
        if (!response.ok) {
          if (response.status === 404) return null;
          throw new Error("Failed to fetch VAL info");
        }
        const json = await response.json();
        return toCamelCase<ValStatDto>(json) ?? null;
      } catch (error) {
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
