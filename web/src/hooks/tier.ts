import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import {
  getTiers,
  getTier,
  addTier,
  updateTier,
  deleteTier,
} from "@/apis/tier";
import { queryKeys } from "@/utils/query";

export function useTiers(guildId: string, presetId: number) {
  return useQuery({
    queryKey: queryKeys.tiers(guildId, presetId),
    queryFn: () => getTiers(guildId, presetId),
  });
}

export function useTier(guildId: string, presetId: number, tierId: number) {
  return useQuery({
    queryKey: queryKeys.tier(guildId, presetId, tierId),
    queryFn: () => getTier(guildId, presetId, tierId),
  });
}

export function useAddTier() {
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

export function useUpdateTier() {
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

export function useDeleteTier() {
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
