import { useMutation, useQueryClient } from "@tanstack/preact-query";
import {
  postPresetMemberPosition,
  deletePresetMemberPosition,
} from "@/apis/presetMemberPosition";

export function useAddPresetMemberPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postPresetMemberPosition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}

export function useDeletePresetMemberPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePresetMemberPosition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}
