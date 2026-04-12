import { useQuery } from "@tanstack/preact-query";
import { getMyUser } from "@/apis/user";

export function useMyUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMyUser,
    retry: false,
  });
}
