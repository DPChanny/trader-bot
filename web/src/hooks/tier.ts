import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import {
  getTiers,
  getTier,
  addTier,
  updateTier,
  deleteTier,
} from "@/apis/tier";

export function useTiers(guildId: string, presetId: number) {
  return useQuery({
    queryKey: ["tiers", guildId, presetId],
    queryFn: () => getTiers(guildId, presetId),
  });
}

export function useTier(guildId: string, presetId: number, tierId: number) {
  return useQuery({
    queryKey: ["tier", guildId, presetId, tierId],
    queryFn: () => getTier(guildId, presetId, tierId),
  });
}

export function useAddTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTier,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tiers", variables.guildId, variables.presetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
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
        queryKey: ["tiers", variables.guildId, variables.presetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
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
        queryKey: ["tiers", variables.guildId, variables.presetId],
      });
      queryClient.removeQueries({
        queryKey: [
          "tier",
          variables.guildId,
          variables.presetId,
          variables.tierId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}
