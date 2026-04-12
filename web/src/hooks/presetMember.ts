import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import {
  getPresetMembers,
  getPresetMember,
  postPresetMember,
  patchPresetMember,
  deletePresetMember,
} from "@/apis/presetMember";

export function usePresetMembers(guildId: string, presetId: number) {
  return useQuery({
    queryKey: ["presetMembers", guildId, presetId],
    queryFn: () => getPresetMembers(guildId, presetId),
  });
}

export function usePresetMember(
  guildId: string,
  presetId: number,
  presetMemberId: number,
) {
  return useQuery({
    queryKey: ["presetMember", guildId, presetId, presetMemberId],
    queryFn: () => getPresetMember(guildId, presetId, presetMemberId),
  });
}

export function useAddPresetMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postPresetMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}

export function useUpdatePresetMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchPresetMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}

export function useDeletePresetMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePresetMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
      queryClient.removeQueries({
        queryKey: [
          "presetMember",
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ],
      });
    },
  });
}
