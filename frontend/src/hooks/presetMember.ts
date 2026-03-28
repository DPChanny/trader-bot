import { useMutation, useQueryClient } from "@tanstack/preact-query";
import { GUILD_API_ENDPOINT } from "@/env";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";
import { throwHttpError } from "@/utils/fetch";

interface AddPresetMemberData {
  memberId: number;
  tierId?: number | null;
  isLeader?: boolean;
}

interface UpdatePresetMemberData {
  tierId?: number | null;
  isLeader?: boolean;
}

function presetMemberEndpoint(guildId: number, presetId: number) {
  return `${GUILD_API_ENDPOINT}/${guildId}/preset/${presetId}/member`;
}

export function useAddPresetMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      data,
    }: {
      guildId: number;
      presetId: number;
      data: AddPresetMemberData;
    }) => {
      const response = await fetch(presetMemberEndpoint(guildId, presetId), {
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

export function useUpdatePresetMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      presetMemberId,
      data,
    }: {
      guildId: number;
      presetId: number;
      presetMemberId: number;
      data: UpdatePresetMemberData;
    }) => {
      const response = await fetch(
        `${presetMemberEndpoint(guildId, presetId)}/${presetMemberId}`,
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

export function useRemovePresetMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      presetMemberId,
    }: {
      guildId: number;
      presetId: number;
      presetMemberId: number;
    }) => {
      const response = await fetch(
        `${presetMemberEndpoint(guildId, presetId)}/${presetMemberId}`,
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
