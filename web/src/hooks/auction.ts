import { useMutation } from "@tanstack/preact-query";
import type { AuctionDTO } from "@/dtos/auctionDto";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { AUCTION_API_ENDPOINT } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function useAddAuction() {
  return useMutation({
    mutationFn: async (presetId: number): Promise<AuctionDTO> => {
      const response = await fetch(`${AUCTION_API_ENDPOINT}/${presetId}`, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) await handleHttpError(response);
      return response.json();
    },
  });
}
