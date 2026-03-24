import { useMutation } from "@tanstack/preact-query";
import type { Auction } from "@/dto";
import { AUCTION_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";

export function useAddAuction() {
  return useMutation({
    mutationFn: async (presetId: number): Promise<Auction> => {
      const response = await fetch(`${AUCTION_API_ENDPOINT}/${presetId}`, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) throw new Error("Failed to add auction");
      return response.json();
    },
  });
}
