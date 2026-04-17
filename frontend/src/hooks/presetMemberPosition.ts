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
import type { PresetMemberDetailDTO } from "@dtos/presetMember";

export function useCreatePresetMemberPosition(): UseMutationResult<
  Awaited<ReturnType<typeof createPresetMemberPosition>>,
  AppError,
  Parameters<typeof createPresetMemberPosition>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPresetMemberPosition,
    onSuccess: (data, variables) => {
      const appendPmp = (pm: PresetMemberDetailDTO): PresetMemberDetailDTO => ({
        ...pm,
        presetMemberPositions: [...pm.presetMemberPositions, data],
      });

      queryClient.setQueryData<PresetMemberDetailDTO[]>(
        queryKeys.presetMembers(variables.guildId, variables.presetId),
        (old) =>
          old?.map((pm) =>
            pm.presetMemberId === variables.presetMemberId ? appendPmp(pm) : pm,
          ),
      );
      queryClient.setQueryData<PresetMemberDetailDTO>(
        queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ),
        (old) => (old ? appendPmp(old) : undefined),
      );
    },
  });
}

export function useDeletePresetMemberPosition(): UseMutationResult<
  void,
  AppError,
  Parameters<typeof deletePresetMemberPosition>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePresetMemberPosition,
    onSuccess: (_, variables) => {
      const removePmp = (pm: PresetMemberDetailDTO): PresetMemberDetailDTO => ({
        ...pm,
        presetMemberPositions: pm.presetMemberPositions.filter(
          (pmp) =>
            pmp.presetMemberPositionId !== variables.presetMemberPositionId,
        ),
      });
      queryClient.setQueryData<PresetMemberDetailDTO[]>(
        queryKeys.presetMembers(variables.guildId, variables.presetId),
        (old) =>
          old?.map((pm) =>
            pm.presetMemberId === variables.presetMemberId ? removePmp(pm) : pm,
          ),
      );
      queryClient.setQueryData<PresetMemberDetailDTO>(
        queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ),
        (old) => (old ? removePmp(old) : undefined),
      );
    },
  });
}
