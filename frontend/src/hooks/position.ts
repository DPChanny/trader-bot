import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { GUILD_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";
import { handleHttpError } from "@/utils/hook";

interface AddPositionData {
  name: string;
  iconUrl?: string;
}

interface UpdatePositionData {
  name?: string;
  iconUrl?: string | null;
}

function positionEndpoint(guildId: number, presetId: number) {
  return `${GUILD_API_ENDPOINT}/${guildId}/preset/${presetId}/position`;
}

export function useAddPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      data,
    }: {
      guildId: number;
      presetId: number;
      data: AddPositionData;
    }) => {
      const response = await fetch(positionEndpoint(guildId, presetId), {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
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

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      positionId,
      data,
    }: {
      guildId: number;
      presetId: number;
      positionId: number;
      data: UpdatePositionData;
    }) => {
      const response = await fetch(
        `${positionEndpoint(guildId, presetId)}/${positionId}`,
        {
          method: "PATCH",
          headers: getAuthHeadersForMutation(),
          body: JSON.stringify(toSnakeCase(data)),
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

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      positionId,
    }: {
      guildId: number;
      presetId: number;
      positionId: number;
    }) => {
      const response = await fetch(
        `${positionEndpoint(guildId, presetId)}/${positionId}`,
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
