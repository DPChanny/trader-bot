import { useQuery } from "@tanstack/preact-query";
import { getMyUser } from "@/apis/user";
import { queryKeys } from "@/utils/query";

export function useMyUser() {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMyUser,
    retry: false,
  });
}
