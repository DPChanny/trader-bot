import { useMutation, useQueryClient } from "@tanstack/preact-query";
import type { AddPresetMemberPositionDTO } from "@/dtos/presetMemberPositionDto";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";
import { getPresetMemberPositionEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

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
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}
