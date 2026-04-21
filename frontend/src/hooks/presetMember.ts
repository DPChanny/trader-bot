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

function invalidatePresetMemberQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  guildId: string,
  presetId: number,
): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.presetMembers(guildId, presetId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.presetMemberPresetScope(guildId, presetId),
  });
}

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
  Awaited<ReturnType<typeof createPresetMember>>,
  AppError,
  Parameters<typeof createPresetMember>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPresetMember,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<PresetMemberDetailDTO[]>(
        queryKeys.presetMembers(variables.guildId, variables.presetId),
        (old) => (old ? [...old, data] : [data]),
      );
      queryClient.setQueryData<PresetMemberDetailDTO>(
        queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          data.presetMemberId,
        ),
        data,
      );
      invalidatePresetMemberQueries(
        queryClient,
        variables.guildId,
        variables.presetId,
      );
    },
  });
}

export function useUpdatePresetMember(): UseMutationResult<
  Awaited<ReturnType<typeof updatePresetMember>>,
  AppError,
  Parameters<typeof updatePresetMember>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePresetMember,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<PresetMemberDetailDTO[]>(
        queryKeys.presetMembers(variables.guildId, variables.presetId),
        (old) =>
          old?.map((pm) =>
            pm.presetMemberId === data.presetMemberId ? data : pm,
          ),
      );
      queryClient.setQueryData<PresetMemberDetailDTO>(
        queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ),
        data,
      );
      invalidatePresetMemberQueries(
        queryClient,
        variables.guildId,
        variables.presetId,
      );
    },
  });
}

export function useDeletePresetMember(): UseMutationResult<
  void,
  AppError,
  Parameters<typeof deletePresetMember>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePresetMember,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<PresetMemberDetailDTO[]>(
        queryKeys.presetMembers(variables.guildId, variables.presetId),
        (old) =>
          old?.filter((pm) => pm.presetMemberId !== variables.presetMemberId),
      );
      queryClient.removeQueries({
        queryKey: queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ),
      });
      invalidatePresetMemberQueries(
        queryClient,
        variables.guildId,
        variables.presetId,
      );
    },
  });
}
