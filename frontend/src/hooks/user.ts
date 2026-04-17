import { useQuery, type UseQueryResult } from "@tanstack/preact-query";
import { getMyUser } from "@apis/user";
import { queryKeys } from "@utils/query";
import { getAccessToken } from "@utils/auth";
import type { UserDetailDTO } from "@dtos/user";
import type { AppError } from "@utils/error";

export function useMyUser(): UseQueryResult<UserDetailDTO | null, AppError> {
  const hasAccessToken = Boolean(getAccessToken());

  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMyUser,
    enabled: hasAccessToken,
  });
}
