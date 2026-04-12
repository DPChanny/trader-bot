import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import {
  getPositions,
  getPosition,
  addPosition,
  updatePosition,
  deletePosition,
} from "@/apis/position";
import { queryKeys } from "@/utils/query";

export function usePositions(guildId: string, presetId: number) {
  return useQuery({
    queryKey: queryKeys.positions(guildId, presetId),
    queryFn: () => getPositions(guildId, presetId),
  });
}

export function usePosition(
  guildId: string,
  presetId: number,
  positionId: number,
) {
  return useQuery({
    queryKey: queryKeys.position(guildId, presetId, positionId),
    queryFn: () => getPosition(guildId, presetId, positionId),
  });
}

export function useAddPosition() {
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

export function useUpdatePosition() {
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

export function useDeletePosition() {
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
