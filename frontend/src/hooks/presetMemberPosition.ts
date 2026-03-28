import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { GUILD_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";
import { throwHttpError } from "@/utils/fetch";

function presetMemberPositionEndpoint(
  guildId: number,
  presetId: number,
  presetMemberId: number,
) {
  return `${GUILD_API_ENDPOINT}/${guildId}/preset/${presetId}/member/${presetMemberId}/position`;
}

export function useAddPresetMemberPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      presetMemberId,
      positionId,
    }: {
      guildId: number;
      presetId: number;
      presetMemberId: number;
      positionId: number;
    }) => {
      const response = await fetch(
        presetMemberPositionEndpoint(guildId, presetId, presetMemberId),
        {
          method: "POST",
          headers: getAuthHeadersForMutation(),
          body: JSON.stringify(toSnakeCase({ positionId })),
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

export function useDeletePresetMemberPosition() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      presetMemberId,
      presetMemberPositionId,
    }: {
      guildId: number;
      presetId: number;
      presetMemberId: number;
      presetMemberPositionId: number;
    }) => {
      const response = await fetch(
        `${presetMemberPositionEndpoint(guildId, presetId, presetMemberId)}/${presetMemberPositionId}`,
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
