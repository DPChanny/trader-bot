import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type {
  AddPositionDTO,
  PositionDTO,
  UpdatePositionDTO,
} from "@/dtos/positionDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getPositionEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function usePositions(guildId: string, presetId: number) {
  return useQuery({
    queryKey: ["positions", guildId, presetId],
    queryFn: async (): Promise<PositionDTO[]> => {
      const response = await fetch(getPositionEndpoint(guildId, presetId), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PositionDTO[]>(json);
    },
  });
}

export function usePosition(
  guildId: string,
  presetId: number,
  positionId: number,
) {
  return useQuery({
    queryKey: ["position", guildId, presetId, positionId],
    queryFn: async (): Promise<PositionDTO> => {
      const response = await fetch(
        `${getPositionEndpoint(guildId, presetId)}/${positionId}`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PositionDTO>(json);
    },
  });
}

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
    }): Promise<PositionDTO> => {
      const response = await fetch(getPositionEndpoint(guildId, presetId), {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(dto)),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PositionDTO>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["positions", variables.guildId, variables.presetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
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
    }): Promise<PositionDTO> => {
      const response = await fetch(
        `${getPositionEndpoint(guildId, presetId)}/${positionId}`,
        {
          method: "PATCH",
          headers: getAuthHeadersForMutation(),
          body: JSON.stringify(toSnakeCase(dto)),
        },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PositionDTO>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["positions", variables.guildId, variables.presetId],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
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
        queryKey: ["positions", variables.guildId, variables.presetId],
      });
      queryClient.removeQueries({
        queryKey: [
          "position",
          variables.guildId,
          variables.presetId,
          variables.positionId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}
