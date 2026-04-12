import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import {
  getPresets,
  getPreset,
  postPreset,
  patchPreset,
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

export function useAddPreset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postPreset,
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
    mutationFn: patchPreset,
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
