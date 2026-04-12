import { useMutation } from "@tanstack/preact-query";
import { postAuction } from "@/apis/auction";

export function useAddAuction() {
  return useMutation({
    mutationFn: postAuction,
  });
}
