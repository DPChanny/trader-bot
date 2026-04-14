import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/preact-query";
import {
  getTiers,
  getTier,
  addTier,
  updateTier,
  deleteTier,
} from "@/apis/tier";
import { queryKeys } from "@/utils/query";
import type { TierDTO } from "@/dtos/tier";

type AddTierVariables = Parameters<typeof addTier>[0];
type AddTierResult = Awaited<ReturnType<typeof addTier>>;
type UpdateTierVariables = Parameters<typeof updateTier>[0];
type UpdateTierResult = Awaited<ReturnType<typeof updateTier>>;
type DeleteTierVariables = Parameters<typeof deleteTier>[0];

export function useTiers(
  guildId: string,
  presetId: number,
): UseQueryResult<TierDTO[], Error> {
  return useQuery({
    queryKey: queryKeys.tiers(guildId, presetId),
    queryFn: () => getTiers(guildId, presetId),
  });
}

export function useTier(
  guildId: string,
  presetId: number,
  tierId: number,
): UseQueryResult<TierDTO, Error> {
  return useQuery({
    queryKey: queryKeys.tier(guildId, presetId, tierId),
    queryFn: () => getTier(guildId, presetId, tierId),
  });
}

export function useAddTier(): UseMutationResult<
  AddTierResult,
  Error,
  AddTierVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTier,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tiers(variables.guildId, variables.presetId),
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

export function useUpdateTier(): UseMutationResult<
  UpdateTierResult,
  Error,
  UpdateTierVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTier,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.tiers(variables.guildId, variables.presetId),
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

export function useDeleteTier(): UseMutationResult<
  void,
  Error,
  DeleteTierVariables,
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
