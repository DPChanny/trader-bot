import { useQuery } from "@tanstack/preact-query";
import type { ValStatDto, ApiResponse } from "@/dto";
import { VAL_STAT_API_ENDPOINT } from "@/env";
import { toCamelCase } from "@/utils/dto";

export const valApi = {
  getByUserId: async (userId: number): Promise<ValStatDto | null> => {
    try {
      const response = await fetch(`${VAL_STAT_API_ENDPOINT}/${userId}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Failed to fetch VAL info");
      }
      const json: ApiResponse<any> = await response.json();
      if (!json.data) return null;
      const result = toCamelCase<ValStatDto>(json.data);
      return result ?? null;
    } catch (error) {
      console.error("Error fetching VAL info:", error);
      return null;
    }
  },
};

export const useValStat = (userId: number | null) => {
  return useQuery({
    queryKey: ["val", userId],
    queryFn: async () => {
      if (!userId) return null;
      return await valApi.getByUserId(userId);
    },
    enabled: !!userId,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};
