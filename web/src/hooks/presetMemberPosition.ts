import { useMutation, useQueryClient } from "@tanstack/preact-query";
import {
  createPresetMemberPosition,
  deletePresetMemberPosition,
} from "@/apis/presetMemberPosition";
import { queryKeys } from "@/utils/query";

export function useCreatePresetMemberPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPresetMemberPosition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.presetMembers(
          variables.guildId,
          variables.presetId,
        ),
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
        queryKey: queryKeys.presetMembers(
          variables.guildId,
          variables.presetId,
        ),
      });
    },
  });
}
