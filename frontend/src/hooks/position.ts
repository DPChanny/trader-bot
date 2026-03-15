import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { POSITION_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";

interface AddPositionData {
  presetId: number;
  name: string;
  iconUrl?: string;
}

interface UpdatePositionData {
  name?: string;
  iconUrl?: string | null;
}

export function useAddPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddPositionData) => {
      const response = await fetch(`${POSITION_API_ENDPOINT}`, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) throw new Error("Failed to add position");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      positionId,
      data,
    }: {
      positionId: number;
      presetId: number;
      data: UpdatePositionData;
    }) => {
      const response = await fetch(`${POSITION_API_ENDPOINT}/${positionId}`, {
        method: "PATCH",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) throw new Error("Failed to update position");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      positionId,
    }: {
      positionId: number;
      presetId: number;
    }) => {
      const response = await fetch(`${POSITION_API_ENDPOINT}/${positionId}`, {
        method: "DELETE",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) throw new Error("Failed to delete position");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}
