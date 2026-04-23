import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { getMyUser } from "@features/user/api";
import { queryKeys } from "@utils/query";
import { getAccessToken } from "@features/auth/token";
import type { UserDetailDTO } from "@features/user/dto";
import type { AppError } from "@utils/error";

export function useMyUser(): UseQueryResult<UserDetailDTO | null, AppError> {
  const hasAccessToken = Boolean(getAccessToken());

  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMyUser,
    enabled: hasAccessToken,
  });
}
