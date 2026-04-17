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

function replacePresetMemberTier(
  presetMember: PresetMemberDetailDTO,
  tier: TierDTO,
): PresetMemberDetailDTO {
  if (presetMember.tier?.tierId !== tier.tierId) {
    return presetMember;
  }

  return {
    ...presetMember,
    tierId: tier.tierId,
    tier,
  };
}

function clearPresetMemberTier(
  presetMember: PresetMemberDetailDTO,
  tierId: number,
): PresetMemberDetailDTO {
  if (presetMember.tierId !== tierId && presetMember.tier?.tierId !== tierId) {
    return presetMember;
  }

  return {
    ...presetMember,
    tierId: null,
    tier: null,
  };
}

function invalidateTierRelatedQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  guildId: string,
  presetId: number,
): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.tiers(guildId, presetId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.tierPresetScope(guildId, presetId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.presetMembers(guildId, presetId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.presetMemberPresetScope(guildId, presetId),
  });
}

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
      queryClient.setQueryData<TierDTO>(
        queryKeys.tier(variables.guildId, variables.presetId, data.tierId),
        data,
      );
      invalidateTierRelatedQueries(
        queryClient,
        variables.guildId,
        variables.presetId,
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
        (old) => old?.map((pm) => replacePresetMemberTier(pm, data)),
      );
      queryClient.setQueriesData<PresetMemberDetailDTO>(
        {
          queryKey: queryKeys.presetMemberPresetScope(
            variables.guildId,
            variables.presetId,
          ),
        },
        (old) => (old ? replacePresetMemberTier(old, data) : old),
      );
      invalidateTierRelatedQueries(
        queryClient,
        variables.guildId,
        variables.presetId,
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
      queryClient.setQueryData<TierDTO[]>(
        queryKeys.tiers(variables.guildId, variables.presetId),
        (old) => old?.filter((t) => t.tierId !== variables.tierId),
      );
      queryClient.removeQueries({
        queryKey: queryKeys.tier(
          variables.guildId,
          variables.presetId,
          variables.tierId,
        ),
      });
      queryClient.setQueryData<PresetMemberDetailDTO[]>(
        queryKeys.presetMembers(variables.guildId, variables.presetId),
        (old) => old?.map((pm) => clearPresetMemberTier(pm, variables.tierId)),
      );
      queryClient.setQueriesData<PresetMemberDetailDTO>(
        {
          queryKey: queryKeys.presetMemberPresetScope(
            variables.guildId,
            variables.presetId,
          ),
        },
        (old) => (old ? clearPresetMemberTier(old, variables.tierId) : old),
      );
      invalidateTierRelatedQueries(
        queryClient,
        variables.guildId,
        variables.presetId,
      );
    },
  });
}
