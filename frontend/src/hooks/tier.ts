import { useMutation, useQueryClient } from "@tanstack/preact-query";
import type { AddTierDTO, UpdateTierDTO } from "@/dtos/tierDto";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";
import { getTierEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function useAddTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      dto,
    }: {
      guildId: string;
      presetId: number;
      dto: AddTierDTO;
    }) => {
      const response = await fetch(getTierEndpoint(guildId, presetId), {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(dto)),
      });
      if (!response.ok) await handleHttpError(response);
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
      dto,
    }: {
      guildId: string;
      presetId: number;
      tierId: number;
      dto: UpdateTierDTO;
    }) => {
      const response = await fetch(
        `${getTierEndpoint(guildId, presetId)}/${tierId}`,
        {
          method: "PATCH",
          headers: getAuthHeadersForMutation(),
          body: JSON.stringify(toSnakeCase(dto)),
        },
      );
      if (!response.ok) await handleHttpError(response);
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
      guildId: string;
      presetId: number;
      tierId: number;
    }) => {
      const response = await fetch(
        `${getTierEndpoint(guildId, presetId)}/${tierId}`,
        {
          method: "DELETE",
          headers: getAuthHeadersForMutation(),
        },
      );
      if (!response.ok) await handleHttpError(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["preset", variables.guildId, variables.presetId],
      });
    },
  });
}
