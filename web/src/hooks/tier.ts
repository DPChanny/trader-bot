import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { AddTierDTO, TierDTO, UpdateTierDTO } from "@/dtos/tierDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getTierEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function useTiers(guildId: string, presetId: number) {
  return useQuery({
    queryKey: ["tiers", guildId, presetId],
    queryFn: async (): Promise<TierDTO[]> => {
      const response = await fetch(getTierEndpoint(guildId, presetId), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<TierDTO[]>(json);
    },
  });
}

export function useTier(guildId: string, presetId: number, tierId: number) {
  return useQuery({
    queryKey: ["tier", guildId, presetId, tierId],
    queryFn: async (): Promise<TierDTO> => {
      const response = await fetch(
        `${getTierEndpoint(guildId, presetId)}/${tierId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<TierDTO>(json);
    },
  });
}

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
      queryClient.invalidateQueries({
        queryKey: ["tiers", variables.guildId, variables.presetId],
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
      queryClient.invalidateQueries({
        queryKey: ["tiers", variables.guildId, variables.presetId],
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
      queryClient.invalidateQueries({
        queryKey: ["tiers", variables.guildId, variables.presetId],
      });
    },
  });
}
