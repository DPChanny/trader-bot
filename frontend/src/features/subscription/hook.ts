import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import { Plan, type SubscriptionDTO } from "@features/subscription/dto";
import type { AppError } from "@utils/error";
import { queryKeys } from "@utils/query";
import {
  getSubscription,
  registerSubscription,
  updateSubscription,
  cancelSubscription,
} from "./api";

export const Quota = {
  PRESET_COUNT: 0,
  AUCTION_TTL: 1,
} as const;

export type Quota = (typeof Quota)[keyof typeof Quota];

const _FREE_QUOTAS: Record<Quota, number | null> = {
  [Quota.PRESET_COUNT]: 1,
  [Quota.AUCTION_TTL]: 600,
};

const _PLAN_QUOTAS: Record<Plan, Record<Quota, number | null>> = {
  [Plan.PLUS]: { [Quota.PRESET_COUNT]: 5, [Quota.AUCTION_TTL]: 1800 },
  [Plan.PRO]: { [Quota.PRESET_COUNT]: null, [Quota.AUCTION_TTL]: 3600 },
};

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

export function useUpdateSubscription(): UseMutationResult<
  Awaited<ReturnType<typeof updateSubscription>>,
  AppError,
  Parameters<typeof updateSubscription>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSubscription,
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
        (prev) => (prev != null ? { ...prev, billingId: null } : prev),
      );
    },
  });
}

export function useVerifyPlan(guildId: string, minPlan: Plan): boolean {
  const { data: subscription } = useSubscription(guildId);
  const plan = subscription?.plan ?? null;
  return plan !== null && plan >= minPlan;
}

export function useGetQuota(guildId: string, quota: Quota): number | null {
  const { data: subscription } = useSubscription(guildId);
  const plan = subscription?.plan ?? null;
  return plan === null ? _FREE_QUOTAS[quota] : _PLAN_QUOTAS[plan][quota];
}

// value: 추가 후 예상 개수 (e.g. presets.length + 1)
export function useVerifyQuota(
  guildId: string,
  quota: Quota,
  value: number,
): boolean {
  const limit = useGetQuota(guildId, quota);
  return limit === null || value <= limit;
}
