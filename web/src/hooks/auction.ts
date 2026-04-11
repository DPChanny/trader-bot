import { useMutation } from "@tanstack/preact-query";
import type { AuctionDTO } from "@/dtos/auctionDto";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { getAuctionEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function useAddAuction() {
  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
    }: {
      guildId: string;
      presetId: number;
    }): Promise<AuctionDTO> => {
      const response = await fetch(getAuctionEndpoint(guildId, presetId), {
        method: "POST",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) await handleHttpError(response);
      return response.json();
    },
  });
}
