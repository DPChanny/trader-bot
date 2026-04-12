import { useMutation } from "@tanstack/preact-query";
import { createAuction } from "@/apis/auction";

export function useCreateAuction() {
  return useMutation({
    mutationFn: createAuction,
  });
}
