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

type AddPositionVariables = Parameters<typeof addPosition>[0];
type AddPositionResult = Awaited<ReturnType<typeof addPosition>>;
type UpdatePositionVariables = Parameters<typeof updatePosition>[0];
type UpdatePositionResult = Awaited<ReturnType<typeof updatePosition>>;
type DeletePositionVariables = Parameters<typeof deletePosition>[0];

export function usePositions(
  guildId: string,
  presetId: number,
): UseQueryResult<PositionDTO[], Error> {
  return useQuery({
    queryKey: queryKeys.positions(guildId, presetId),
    queryFn: () => getPositions(guildId, presetId),
  });
}

export function usePosition(
  guildId: string,
  presetId: number,
  positionId: number,
): UseQueryResult<PositionDTO, Error> {
  return useQuery({
    queryKey: queryKeys.position(guildId, presetId, positionId),
    queryFn: () => getPosition(guildId, presetId, positionId),
  });
}

export function useAddPosition(): UseMutationResult<
  AddPositionResult,
  Error,
  AddPositionVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addPosition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.positions(variables.guildId, variables.presetId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.presetMembers(
          variables.guildId,
          variables.presetId,
        ),
      });
    },
  });
}

export function useUpdatePosition(): UseMutationResult<
  UpdatePositionResult,
  Error,
  UpdatePositionVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePosition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.positions(variables.guildId, variables.presetId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.presetMembers(
          variables.guildId,
          variables.presetId,
        ),
      });
    },
  });
}

export function useDeletePosition(): UseMutationResult<
  void,
  Error,
  DeletePositionVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePosition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.positions(variables.guildId, variables.presetId),
      });
      queryClient.removeQueries({
        queryKey: queryKeys.position(
          variables.guildId,
          variables.presetId,
          variables.positionId,
        ),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.presetMembers(
          variables.guildId,
          variables.presetId,
        ),
      });
    },
  });
}
