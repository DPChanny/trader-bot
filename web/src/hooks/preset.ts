import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import {
  getPresets,
  getPreset,
  createPreset,
  updatePreset,
  deletePreset,
} from "@/apis/preset";

export function usePresets(guildId: string) {
  return useQuery({
    queryKey: ["presets", guildId],
    queryFn: () => getPresets(guildId),
  });
}

export function usePreset(guildId: string, presetId: number) {
  return useQuery({
    queryKey: ["preset", guildId, presetId],
    queryFn: () => getPreset(guildId, presetId),
  });
}

export function useCreatePreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPreset,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presets", variables.guildId],
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
        queryKey: ["presets", variables.guildId],
      });
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.guildId, variables.presetId],
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
        queryKey: ["presets", variables.guildId],
      });
      queryClient.removeQueries({
        queryKey: ["preset", variables.guildId, variables.presetId],
      });
      queryClient.removeQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
      queryClient.removeQueries({
        queryKey: ["presetMember", variables.guildId, variables.presetId],
      });
      queryClient.removeQueries({
        queryKey: ["tiers", variables.guildId, variables.presetId],
      });
      queryClient.removeQueries({
        queryKey: ["tier", variables.guildId, variables.presetId],
      });
      queryClient.removeQueries({
        queryKey: ["positions", variables.guildId, variables.presetId],
      });
      queryClient.removeQueries({
        queryKey: ["position", variables.guildId, variables.presetId],
      });
    },
  });
}
