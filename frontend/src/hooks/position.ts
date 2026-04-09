import { useMutation, useQueryClient } from "@tanstack/preact-query";
import type { AddPositionDTO, UpdatePositionDTO } from "@/dtos/positionDto";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";
import { getPositionEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function useAddPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      dto,
    }: {
      guildId: string;
      presetId: number;
      dto: AddPositionDTO;
    }) => {
      const response = await fetch(getPositionEndpoint(guildId, presetId), {
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

export function useUpdatePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      positionId,
      dto,
    }: {
      guildId: string;
      presetId: number;
      positionId: number;
      dto: UpdatePositionDTO;
    }) => {
      const response = await fetch(
        `${getPositionEndpoint(guildId, presetId)}/${positionId}`,
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

export function useDeletePosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      positionId,
    }: {
      guildId: string;
      presetId: number;
      positionId: number;
    }) => {
      const response = await fetch(
        `${getPositionEndpoint(guildId, presetId)}/${positionId}`,
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
