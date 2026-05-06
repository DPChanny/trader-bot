import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { BillingDTO } from "@features/billing/dto";
import type { AppError } from "@utils/error";
import { queryKeys } from "@utils/query";
import { getBillings, registerBilling, deleteBilling } from "./api";

export function useBillings(): UseQueryResult<BillingDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.billings(),
    queryFn: getBillings,
  });
}

export function useRegisterBilling(): UseMutationResult<
  Awaited<ReturnType<typeof registerBilling>>,
  AppError,
  Parameters<typeof registerBilling>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerBilling,
    onSuccess: (data) => {
      queryClient.setQueryData<BillingDTO[]>(queryKeys.billings(), (old) =>
        old ? [...old, data] : [data],
      );
    },
  });
}

export function useDeleteBilling(): UseMutationResult<
  Awaited<ReturnType<typeof deleteBilling>>,
  AppError,
  Parameters<typeof deleteBilling>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBilling,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<BillingDTO[]>(queryKeys.billings(), (old) =>
        old?.filter((b) => b.billingId !== variables.billingId),
      );
    },
  });
}
