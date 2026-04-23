import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  getPresets,
  getPreset,
  createPreset,
  updatePreset,
  deletePreset,
} from "@features/preset/api";
import { queryKeys } from "@utils/query";
import type { PresetDTO } from "@features/preset/dto";
import type { AppError } from "@utils/error";

export function usePresets(
  guildId: string,
): UseQueryResult<PresetDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.presets(guildId),
    queryFn: () => getPresets(guildId),
  });
}

export function usePreset(
  guildId: string,
  presetId: number,
): UseQueryResult<PresetDTO, AppError> {
  return useQuery({
    queryKey: queryKeys.preset(guildId, presetId),
    queryFn: () => getPreset(guildId, presetId),
  });
}

export function useCreatePreset(): UseMutationResult<
  Awaited<ReturnType<typeof createPreset>>,
  AppError,
  Parameters<typeof createPreset>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPreset,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<PresetDTO[]>(
        queryKeys.presets(variables.guildId),
        (old) => (old ? [...old, data] : [data]),
      );
      queryClient.setQueryData<PresetDTO>(
        queryKeys.preset(variables.guildId, data.presetId),
        data,
      );
    },
  });
}

export function useUpdatePreset(): UseMutationResult<
  Awaited<ReturnType<typeof updatePreset>>,
  AppError,
  Parameters<typeof updatePreset>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePreset,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<PresetDTO[]>(
        queryKeys.presets(variables.guildId),
        (old) => old?.map((p) => (p.presetId === data.presetId ? data : p)),
      );
      queryClient.setQueryData<PresetDTO>(
        queryKeys.preset(variables.guildId, variables.presetId),
        data,
      );
    },
  });
}

export function useDeletePreset(): UseMutationResult<
  void,
  AppError,
  Parameters<typeof deletePreset>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePreset,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<PresetDTO[]>(
        queryKeys.presets(variables.guildId),
        (old) => old?.filter((p) => p.presetId !== variables.presetId),
      );
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
        queryKey: queryKeys.presetMemberPresetScope(
          variables.guildId,
          variables.presetId,
        ),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.tiers(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.tierPresetScope(
          variables.guildId,
          variables.presetId,
        ),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.positions(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.positionPresetScope(
          variables.guildId,
          variables.presetId,
        ),
      });
    },
  });
}

