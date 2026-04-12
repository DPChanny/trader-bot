import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import {
  getPositions,
  getPosition,
  postPosition,
  patchPosition,
  deletePosition,
} from "@/apis/position";

export function usePositions(guildId: string, presetId: number) {
  return useQuery({
    queryKey: ["positions", guildId, presetId],
    queryFn: () => getPositions(guildId, presetId),
  });
}

export function usePosition(
  guildId: string,
  presetId: number,
  positionId: number,
) {
  return useQuery({
    queryKey: ["position", guildId, presetId, positionId],
    queryFn: () => getPosition(guildId, presetId, positionId),
  });
}

export function useAddPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postPosition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["positions", variables.guildId, variables.presetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchPosition,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["positions", variables.guildId, variables.presetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
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
        queryKey: ["positions", variables.guildId, variables.presetId],
      });
      queryClient.removeQueries({
        queryKey: [
          "position",
          variables.guildId,
          variables.presetId,
          variables.positionId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}
