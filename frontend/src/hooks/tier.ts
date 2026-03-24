import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { TIER_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";
import { throwHttpError } from "@/utils/fetch";

interface AddTierData {
  presetId: number;
  name: string;
}

interface UpdateTierData {
  name: string;
}

export function useAddTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddTierData) => {
      const response = await fetch(`${TIER_API_ENDPOINT}`, {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) await throwHttpError(response);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useUpdateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tierId,
      data,
    }: {
      tierId: number;
      presetId: number;
      data: UpdateTierData;
    }) => {
      const response = await fetch(`${TIER_API_ENDPOINT}/${tierId}`, {
        method: "PATCH",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) await throwHttpError(response);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}

export function useDeleteTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tierId }: { tierId: number; presetId: number }) => {
      const response = await fetch(`${TIER_API_ENDPOINT}/${tierId}`, {
        method: "DELETE",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) await throwHttpError(response);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.presetId],
      });
    },
  });
}
