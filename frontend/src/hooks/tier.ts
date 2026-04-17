import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/preact-query";
import { getTiers, getTier, addTier, updateTier, deleteTier } from "@apis/tier";
import { queryKeys } from "@utils/query";
import type { TierDTO } from "@dtos/tier";
import type { AppError } from "@utils/error";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";

export function useTiers(
  guildId: string,
  presetId: number,
): UseQueryResult<TierDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.tiers(guildId, presetId),
    queryFn: () => getTiers(guildId, presetId),
  });
}

export function useTier(
  guildId: string,
  presetId: number,
  tierId: number,
): UseQueryResult<TierDTO, AppError> {
  return useQuery({
    queryKey: queryKeys.tier(guildId, presetId, tierId),
    queryFn: () => getTier(guildId, presetId, tierId),
  });
}

export function useAddTier(): UseMutationResult<
  Awaited<ReturnType<typeof addTier>>,
  AppError,
  Parameters<typeof addTier>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTier,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<TierDTO[]>(
        queryKeys.tiers(variables.guildId, variables.presetId),
        (old) => (old ? [...old, data] : [data]),
      );
    },
  });
}

export function useUpdateTier(): UseMutationResult<
  Awaited<ReturnType<typeof updateTier>>,
  AppError,
  Parameters<typeof updateTier>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTier,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<TierDTO[]>(
        queryKeys.tiers(variables.guildId, variables.presetId),
        (old) => old?.map((t) => (t.tierId === data.tierId ? data : t)),
      );
      queryClient.setQueryData<TierDTO>(
        queryKeys.tier(variables.guildId, variables.presetId, variables.tierId),
        data,
      );
      queryClient.setQueryData<PresetMemberDetailDTO[]>(
        queryKeys.presetMembers(variables.guildId, variables.presetId),
        (old) =>
          old?.map((pm) =>
            pm.tier?.tierId === data.tierId ? { ...pm, tier: data } : pm,
          ),
      );
    },
  });
}

export function useDeleteTier(): UseMutationResult<
  void,
  AppError,
  Parameters<typeof deleteTier>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTier,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tiers(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.tier(
          variables.guildId,
          variables.presetId,
          variables.tierId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.presetMembers(
          variables.guildId,
          variables.presetId,
        ),
      });
    },
  });
}
