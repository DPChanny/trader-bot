import { useMutation, type UseMutationResult } from "@tanstack/preact-query";
import { createAuction } from "@/apis/auction";

type CreateAuctionVariables = Parameters<typeof createAuction>[0];
type CreateAuctionResult = Awaited<ReturnType<typeof createAuction>>;

export function useCreateAuction(): UseMutationResult<
  CreateAuctionResult,
  Error,
  CreateAuctionVariables,
  unknown
> {
  return useMutation({
    mutationFn: createAuction,
  });
}
