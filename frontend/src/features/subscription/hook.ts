import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { SubscriptionDTO } from "@features/subscription/dto";
import type { AppError } from "@utils/error";
import { queryKeys } from "@utils/query";
import {
  getSubscription,
  registerSubscription,
  cancelSubscription,
} from "./api";

export function useSubscription(
  guildId: string,
): UseQueryResult<SubscriptionDTO | null, AppError> {
  return useQuery({
    queryKey: queryKeys.subscription(guildId),
    queryFn: () => getSubscription(guildId),
  });
}

export function useRegisterSubscription(): UseMutationResult<
  Awaited<ReturnType<typeof registerSubscription>>,
  AppError,
  Parameters<typeof registerSubscription>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerSubscription,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<SubscriptionDTO>(
        queryKeys.subscription(variables.guildId),
        data,
      );
    },
  });
}

export function useCancelSubscription(): UseMutationResult<
  Awaited<ReturnType<typeof cancelSubscription>>,
  AppError,
  Parameters<typeof cancelSubscription>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<SubscriptionDTO | null>(
        queryKeys.subscription(variables.guildId),
        null,
      );
    },
  });
}
