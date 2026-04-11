import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type {
  AddPresetMemberPositionDTO,
  PresetMemberPositionDTO,
} from "@/dtos/presetMemberPositionDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getPresetMemberPositionEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function usePresetMemberPositions(
  guildId: string | null,
  presetId: number | null,
  presetMemberId: number | null,
) {
  return useQuery({
    queryKey: ["presetMemberPositions", guildId, presetId, presetMemberId],
    queryFn: async (): Promise<PresetMemberPositionDTO[]> => {
      const response = await fetch(
        getPresetMemberPositionEndpoint(guildId!, presetId!, presetMemberId!),
        { headers: getAuthHeaders() },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PresetMemberPositionDTO[]>(json);
    },
    enabled: !!guildId && !!presetId && !!presetMemberId,
  });
}

export function usePresetMemberPosition(
  guildId: string | null,
  presetId: number | null,
  presetMemberId: number | null,
  presetMemberPositionId: number | null,
) {
  return useQuery({
    queryKey: [
      "presetMemberPosition",
      guildId,
      presetId,
      presetMemberId,
      presetMemberPositionId,
    ],
    queryFn: async (): Promise<PresetMemberPositionDTO> => {
      const response = await fetch(
        `${getPresetMemberPositionEndpoint(guildId!, presetId!, presetMemberId!)}/${presetMemberPositionId}`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PresetMemberPositionDTO>(json);
    },
    enabled:
      !!guildId && !!presetId && !!presetMemberId && !!presetMemberPositionId,
  });
}

export function useAddPresetMemberPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      presetMemberId,
      dto,
    }: {
      guildId: string;
      presetId: number;
      presetMemberId: number;
      dto: AddPresetMemberPositionDTO;
    }) => {
      const response = await fetch(
        getPresetMemberPositionEndpoint(guildId, presetId, presetMemberId),
        {
          method: "POST",
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
        queryKey: [
          "presetMemberPositions",
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}

export function useDeletePresetMemberPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      presetMemberId,
      presetMemberPositionId,
    }: {
      guildId: string;
      presetId: number;
      presetMemberId: number;
      presetMemberPositionId: number;
    }) => {
      const response = await fetch(
        `${getPresetMemberPositionEndpoint(guildId, presetId, presetMemberId)}/${presetMemberPositionId}`,
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
        queryKey: [
          "presetMemberPositions",
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}
