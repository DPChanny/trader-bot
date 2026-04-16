import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/preact-query";
import {
  createPresetMemberPosition,
  deletePresetMemberPosition,
} from "@apis/presetMemberPosition";
import { queryKeys } from "@utils/query";
import type { AppError } from "@utils/error";

type CreatePresetMemberPositionVariables = Parameters<
  typeof createPresetMemberPosition
>[0];
type CreatePresetMemberPositionResult = Awaited<
  ReturnType<typeof createPresetMemberPosition>
>;
type DeletePresetMemberPositionVariables = Parameters<
  typeof deletePresetMemberPosition
>[0];

export function useCreatePresetMemberPosition(): UseMutationResult<
  CreatePresetMemberPositionResult,
  AppError,
  CreatePresetMemberPositionVariables,
  unknown
> {
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ),
      });
    },
  });
}

export function useDeletePresetMemberPosition(): UseMutationResult<
  void,
  AppError,
  DeletePresetMemberPositionVariables,
  unknown
> {
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
      queryClient.invalidateQueries({
        queryKey: queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ),
      });
    },
  });
}
