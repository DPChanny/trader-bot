import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type {
  AddPresetMemberDTO,
  PresetMemberDetailDTO,
  UpdatePresetMemberDTO,
} from "@/dtos/presetMemberDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getPresetMemberEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function usePresetMembers(
  guildId: string | null,
  presetId: number | null,
) {
  return useQuery({
    queryKey: ["presetMembers", guildId, presetId],
    queryFn: async (): Promise<PresetMemberDetailDTO[]> => {
      const response = await fetch(
        getPresetMemberEndpoint(guildId!, presetId!),
        { headers: getAuthHeaders() },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PresetMemberDetailDTO[]>(json);
    },
    enabled: !!guildId && !!presetId,
  });
}

export function usePresetMember(
  guildId: string | null,
  presetId: number | null,
  presetMemberId: number | null,
) {
  return useQuery({
    queryKey: ["presetMember", guildId, presetId, presetMemberId],
    queryFn: async (): Promise<PresetMemberDetailDTO> => {
      const response = await fetch(
        `${getPresetMemberEndpoint(guildId!, presetId!)}/${presetMemberId}`,
        { headers: getAuthHeaders() },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<PresetMemberDetailDTO>(json);
    },
    enabled: !!guildId && !!presetId && !!presetMemberId,
  });
}

export function useAddPresetMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      dto,
    }: {
      guildId: string;
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
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
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
      guildId: string;
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
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}

export function useDeletePresetMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      presetId,
      presetMemberId,
    }: {
      guildId: string;
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
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId, variables.presetId],
      });
    },
  });
}
