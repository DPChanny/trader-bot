import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { PRESET_USER_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";

export const presetUserApi = {
  add: async (data: {
    presetId: number;
    userId: number;
    tierId: number | null;
    isLeader?: boolean;
  }): Promise<any> => {
    const response = await fetch(`${PRESET_USER_API_ENDPOINT}/`, {
      method: "POST",
      headers: getAuthHeadersForMutation(),
      body: JSON.stringify(toSnakeCase(data)),
    });
    if (!response.ok) throw new Error("Failed to add preset user");
    return response.json();
  },

  update: async (
    presetUserId: number,
    data: { tierId: number | null; isLeader?: boolean },
  ): Promise<any> => {
    const response = await fetch(
      `${PRESET_USER_API_ENDPOINT}/${presetUserId}`,
      {
        method: "PATCH",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      },
    );
    if (!response.ok) throw new Error("Failed to update preset user");
    return response.json();
  },

  delete: async (presetUserId: number): Promise<any> => {
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
};

export const useAddPresetUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: presetUserApi.add,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};

export const useUpdatePresetUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      presetUserId,
      tierId,
      isLeader,
    }: {
      presetUserId: number;
      presetId: number;
      tierId: number | null;
      isLeader?: boolean;
    }) => presetUserApi.update(presetUserId, { tierId, isLeader }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};

export const useRemovePresetUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      presetUserId,
    }: {
      presetUserId: number;
      presetId: number;
    }) => presetUserApi.delete(presetUserId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
};
