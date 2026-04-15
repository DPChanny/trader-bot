import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/preact-query";
import {
  getPresets,
  getPreset,
  createPreset,
  updatePreset,
  deletePreset,
} from "@apis/preset";
import { queryKeys } from "@utils/query";
import type { PresetDTO } from "@dtos/preset";

type CreatePresetVariables = Parameters<typeof createPreset>[0];
type CreatePresetResult = Awaited<ReturnType<typeof createPreset>>;
type UpdatePresetVariables = Parameters<typeof updatePreset>[0];
type UpdatePresetResult = Awaited<ReturnType<typeof updatePreset>>;
type DeletePresetVariables = Parameters<typeof deletePreset>[0];

export function usePresets(
  guildId: string,
): UseQueryResult<PresetDTO[], Error> {
  return useQuery({
    queryKey: queryKeys.presets(guildId),
    queryFn: () => getPresets(guildId),
  });
}

export function usePreset(
  guildId: string,
  presetId: number,
): UseQueryResult<PresetDTO, Error> {
  return useQuery({
    queryKey: queryKeys.preset(guildId, presetId),
    queryFn: () => getPreset(guildId, presetId),
  });
}

export function useCreatePreset(): UseMutationResult<
  CreatePresetResult,
  Error,
  CreatePresetVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPreset,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.presets(variables.guildId),
      });
    },
  });
}

export function useUpdatePreset(): UseMutationResult<
  UpdatePresetResult,
  Error,
  UpdatePresetVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePreset,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.presets(variables.guildId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.preset(variables.guildId, variables.presetId),
      });
    },
  });
}

export function useDeletePreset(): UseMutationResult<
  void,
  Error,
  DeletePresetVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePreset,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.presets(variables.guildId),
      });
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
        queryKey: queryKeys.presetMemberAll(
          variables.guildId,
          variables.presetId,
        ),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.tiers(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.tierAll(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.positions(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.positionAll(variables.guildId, variables.presetId),
      });
    },
  });
}
