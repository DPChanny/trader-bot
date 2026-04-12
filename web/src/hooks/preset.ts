import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import {
  getPresets,
  getPreset,
  createPreset,
  updatePreset,
  deletePreset,
} from "@/apis/preset";
import { queryKeys } from "@/utils/query";

export function usePresets(guildId: string) {
  return useQuery({
    queryKey: queryKeys.presets(guildId),
    queryFn: () => getPresets(guildId),
  });
}

export function usePreset(guildId: string, presetId: number) {
  return useQuery({
    queryKey: queryKeys.preset(guildId, presetId),
    queryFn: () => getPreset(guildId, presetId),
  });
}

export function useCreatePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPreset,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.presets(variables.guildId),
      });
    },
  });
}

export function useUpdatePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePreset,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.presets(variables.guildId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.preset(variables.guildId, variables.presetId),
      });
    },
  });
}

export function useDeletePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePreset,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.presets(variables.guildId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.preset(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.presetMembers(
          variables.guildId,
          variables.presetId,
        ),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.presetMemberAll(
          variables.guildId,
          variables.presetId,
        ),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.tiers(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.tierAll(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.positions(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.positionAll(variables.guildId, variables.presetId),
      });
    },
  });
}
