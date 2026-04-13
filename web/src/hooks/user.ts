import { useQuery, type UseQueryResult } from "@tanstack/preact-query";
import { getMyUser } from "@/apis/user";
import { queryKeys } from "@/utils/query";
import type { UserDetailDTO } from "@/dtos/userDto";

export function useMyUser(): UseQueryResult<UserDetailDTO | null, Error> {
  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMyUser,
    retry: false,
  });
}
