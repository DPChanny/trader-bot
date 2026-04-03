import { useMutation, useQueryClient } from "@tanstack/preact-query";
import type {
  AddPresetMemberDTO,
  UpdatePresetMemberDTO,
} from "@/dtos/presetMemberDto";
import { getAuthHeadersForMutation } from "@/utils/auth";
import { toSnakeCase } from "@/utils/dto";
import { getPresetMemberEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function useAddPresetMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      dto,
    }: {
      guildId: number;
      presetId: number;
      dto: AddPresetMemberDTO;
    }) => {
      const response = await fetch(getPresetMemberEndpoint(guildId, presetId), {
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

export function useUpdatePresetMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      presetMemberId,
      dto,
    }: {
      guildId: number;
      presetId: number;
      presetMemberId: number;
      dto: UpdatePresetMemberDTO;
    }) => {
      const response = await fetch(
        `${getPresetMemberEndpoint(guildId, presetId)}/${presetMemberId}`,
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
        `${getPresetMemberEndpoint(guildId, presetId)}/${presetMemberId}`,
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
