import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { getMyUser, getMyPayments, deleteMyUser } from "@features/user/api";
import { queryKeys } from "@utils/query";
import { getAccessToken } from "@features/auth/token";
import type { UserDetailDTO } from "@features/user/dto";
import type { PaymentDTO } from "@features/payment/dto";
import type { AppError } from "@utils/error";

export function useMyUser(): UseQueryResult<UserDetailDTO | null, AppError> {
  const hasAccessToken = Boolean(getAccessToken());

  return useQuery({
    queryKey: queryKeys.me(),
    queryFn: getMyUser,
    enabled: hasAccessToken,
  });
}

export function useMyPayments(): UseQueryResult<PaymentDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.myPayments(),
    queryFn: getMyPayments,
  });
}

export function useDeleteMyUser(): UseMutationResult<
  void,
  AppError,
  void,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMyUser,
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
