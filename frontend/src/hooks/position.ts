import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/preact-query";
import {
  getPositions,
  getPosition,
  addPosition,
  updatePosition,
  deletePosition,
} from "@apis/position";
import { queryKeys } from "@utils/query";
import type { PositionDTO } from "@dtos/position";
import type { AppError } from "@utils/error";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";

export function usePositions(
  guildId: string,
  presetId: number,
): UseQueryResult<PositionDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.positions(guildId, presetId),
    queryFn: () => getPositions(guildId, presetId),
  });
}

export function usePosition(
  guildId: string,
  presetId: number,
  positionId: number,
): UseQueryResult<PositionDTO, AppError> {
  return useQuery({
    queryKey: queryKeys.position(guildId, presetId, positionId),
    queryFn: () => getPosition(guildId, presetId, positionId),
  });
}

export function useAddPosition(): UseMutationResult<
  Awaited<ReturnType<typeof addPosition>>,
  AppError,
  Parameters<typeof addPosition>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addPosition,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<PositionDTO[]>(
        queryKeys.positions(variables.guildId, variables.presetId),
        (old) => (old ? [...old, data] : [data]),
      );
      queryClient.setQueryData<PositionDTO>(
        queryKeys.position(
          variables.guildId,
          variables.presetId,
          data.positionId,
        ),
        data,
      );
    },
  });
}

export function useUpdatePosition(): UseMutationResult<
  Awaited<ReturnType<typeof updatePosition>>,
  AppError,
  Parameters<typeof updatePosition>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePosition,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<PositionDTO[]>(
        queryKeys.positions(variables.guildId, variables.presetId),
        (old) => old?.map((p) => (p.positionId === data.positionId ? data : p)),
      );
      queryClient.setQueryData<PositionDTO>(
        queryKeys.position(
          variables.guildId,
          variables.presetId,
          variables.positionId,
        ),
        data,
      );
      queryClient.setQueryData<PresetMemberDetailDTO[]>(
        queryKeys.presetMembers(variables.guildId, variables.presetId),
        (old) =>
          old?.map((pm) => ({
            ...pm,
            presetMemberPositions: pm.presetMemberPositions.map((pmp) =>
              pmp.position.positionId === data.positionId
                ? { ...pmp, position: data }
                : pmp,
            ),
          })),
      );
      queryClient.setQueriesData<PresetMemberDetailDTO>(
        {
          queryKey: queryKeys.presetMemberPresetScope(
            variables.guildId,
            variables.presetId,
          ),
        },
        (old) =>
          old
            ? {
                ...old,
                presetMemberPositions: old.presetMemberPositions.map((pmp) =>
                  pmp.position.positionId === data.positionId
                    ? { ...pmp, position: data }
                    : pmp,
                ),
              }
            : old,
      );
    },
  });
}

export function useDeletePosition(): UseMutationResult<
  void,
  AppError,
  Parameters<typeof deletePosition>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePosition,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<PositionDTO[]>(
        queryKeys.positions(variables.guildId, variables.presetId),
        (old) => old?.filter((p) => p.positionId !== variables.positionId),
      );
      queryClient.removeQueries({
        queryKey: queryKeys.position(
          variables.guildId,
          variables.presetId,
          variables.positionId,
        ),
      });
      queryClient.setQueryData<PresetMemberDetailDTO[]>(
        queryKeys.presetMembers(variables.guildId, variables.presetId),
        (old) =>
          old?.map((pm) => ({
            ...pm,
            presetMemberPositions: pm.presetMemberPositions.filter(
              (pmp) => pmp.position.positionId !== variables.positionId,
            ),
          })),
      );
      queryClient.setQueriesData<PresetMemberDetailDTO>(
        {
          queryKey: queryKeys.presetMemberPresetScope(
            variables.guildId,
            variables.presetId,
          ),
        },
        (old) =>
          old
            ? {
                ...old,
                presetMemberPositions: old.presetMemberPositions.filter(
                  (pmp) => pmp.position.positionId !== variables.positionId,
                ),
              }
            : old,
      );
    },
  });
}
