import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { GUILD_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";
import { throwHttpError } from "@/utils/fetch";

interface AddTierData {
  name: string;
}

interface UpdateTierData {
  name: string;
}

function tierEndpoint(guildId: number, presetId: number) {
  return `${GUILD_API_ENDPOINT}/${guildId}/preset/${presetId}/tier`;
}

export function useAddTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      data,
    }: {
      guildId: number;
      presetId: number;
      data: AddTierData;
    }) => {
      const response = await fetch(tierEndpoint(guildId, presetId), {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) await throwHttpError(response);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.guildId, variables.presetId],
      });
    },
  });
}

export function useUpdateTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      tierId,
      data,
    }: {
      guildId: number;
      presetId: number;
      tierId: number;
      data: UpdateTierData;
    }) => {
      const response = await fetch(
        `${tierEndpoint(guildId, presetId)}/${tierId}`,
        {
          method: "PATCH",
          headers: getAuthHeadersForMutation(),
          body: JSON.stringify(toSnakeCase(data)),
        },
      );
      if (!response.ok) await throwHttpError(response);
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.guildId, variables.presetId],
      });
    },
  });
}

export function useDeleteTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      tierId,
    }: {
      guildId: number;
      presetId: number;
      tierId: number;
    }) => {
      const response = await fetch(
        `${tierEndpoint(guildId, presetId)}/${tierId}`,
        {
          method: "DELETE",
          headers: getAuthHeadersForMutation(),
        },
      );
      if (!response.ok) await throwHttpError(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.guildId, variables.presetId],
      });
    },
  });
}
