import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { PRESET_USER_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";

interface AddPresetUserData {
  presetId: number;
  userId: number;
  tierId: number | null;
  isLeader?: boolean;
}

interface UpdatePresetUserData {
  presetUserId: number;
  presetId: number;
  tierId: number | null;
  isLeader?: boolean;
}

interface RemovePresetUserData {
  presetUserId: number;
  presetId: number;
}

export function useAddPresetUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddPresetUserData) => {
      const response = await fetch(`${PRESET_USER_API_ENDPOINT}`, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) throw new Error("Failed to add preset user");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useUpdatePresetUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      presetUserId,
      presetId: _,
      tierId,
      isLeader,
    }: UpdatePresetUserData) => {
      const response = await fetch(
        `${PRESET_USER_API_ENDPOINT}/${presetUserId}`,
        {
          method: "PATCH",
          headers: getAuthHeadersForMutation(),
          body: JSON.stringify(toSnakeCase({ tierId, isLeader })),
        },
      );
      if (!response.ok) throw new Error("Failed to update preset user");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useRemovePresetUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ presetUserId }: RemovePresetUserData) => {
      const response = await fetch(
        `${PRESET_USER_API_ENDPOINT}/${presetUserId}`,
        {
          method: "DELETE",
          headers: getAuthHeadersForMutation(),
        },
      );
      if (!response.ok) throw new Error("Failed to remove preset user");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}
