import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { PRESET_USER_POSITION_API_ENDPOINT } from "../env";
import { toSnakeCase } from "@/utils/dto";
import { throwHttpError } from "@/utils/fetch";

interface AddPresetUserPositionData {
  presetUserId: number;
  positionId: number;
  presetId?: number;
}

interface DeletePresetUserPositionData {
  presetUserPositionId: number;
  presetId?: number;
}

export function useAddPresetUserPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddPresetUserPositionData) => {
      const { presetId, ...payload } = data;
      const response = await fetch(`${PRESET_USER_POSITION_API_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSnakeCase(payload)),
      });
      if (!response.ok) await throwHttpError(response);
      return response.json();
    },
    onSuccess: (_, variables) => {
      if (variables.presetId) {
        queryClient.invalidateQueries({
          queryKey: ["preset", variables.presetId],
        });
      }
    },
  });
}

export function useDeletePresetUserPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: DeletePresetUserPositionData) => {
      const { presetId, ...payload } = data;
      const response = await fetch(`${PRESET_USER_POSITION_API_ENDPOINT}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toSnakeCase(payload)),
      });
      if (!response.ok) await throwHttpError(response);
      return response.json();
    },
    onSuccess: (_, variables) => {
      if (variables.presetId) {
        queryClient.invalidateQueries({
          queryKey: ["preset", variables.presetId],
        });
      }
    },
  });
}
