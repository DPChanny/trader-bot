import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/preact-query";
import {
  getPresetMembers,
  getPresetMember,
  createPresetMember,
  updatePresetMember,
  deletePresetMember,
} from "@apis/presetMember";
import { queryKeys, queryStaleTimes } from "@utils/query";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import type { AppError } from "@utils/error";

type CreatePresetMemberVariables = Parameters<typeof createPresetMember>[0];
type CreatePresetMemberResult = Awaited<ReturnType<typeof createPresetMember>>;
type UpdatePresetMemberVariables = Parameters<typeof updatePresetMember>[0];
type UpdatePresetMemberResult = Awaited<ReturnType<typeof updatePresetMember>>;
type DeletePresetMemberVariables = Parameters<typeof deletePresetMember>[0];

export function usePresetMembers(
  guildId: string,
  presetId: number,
): UseQueryResult<PresetMemberDetailDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.presetMembers(guildId, presetId),
    queryFn: () => getPresetMembers(guildId, presetId),
    staleTime: queryStaleTimes.interactive,
  });
}

export function usePresetMember(
  guildId: string,
  presetId: number,
  presetMemberId: number,
): UseQueryResult<PresetMemberDetailDTO, AppError> {
  return useQuery({
    queryKey: queryKeys.presetMember(guildId, presetId, presetMemberId),
    queryFn: () => getPresetMember(guildId, presetId, presetMemberId),
    staleTime: queryStaleTimes.interactive,
  });
}

export function useCreatePresetMember(): UseMutationResult<
  CreatePresetMemberResult,
  AppError,
  CreatePresetMemberVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPresetMember,
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

export function useUpdatePresetMember(): UseMutationResult<
  UpdatePresetMemberResult,
  AppError,
  UpdatePresetMemberVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePresetMember,
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

export function useDeletePresetMember(): UseMutationResult<
  void,
  AppError,
  DeletePresetMemberVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePresetMember,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.presetMembers(
          variables.guildId,
          variables.presetId,
        ),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ),
      });
    },
  });
}
