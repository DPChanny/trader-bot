import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { MemberDetailDTO, UpdateMemberDTO } from "@/dtos/memberDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getMemberEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function useMyMember(guildId: string) {
  return useQuery({
    queryKey: ["members", guildId, "me"],
    queryFn: async (): Promise<MemberDetailDTO> => {
      const response = await fetch(`${getMemberEndpoint(guildId)}/me`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<MemberDetailDTO>(json);
    },
  });
}

export function useMembers(guildId: string) {
  return useQuery({
    queryKey: ["members", guildId],
    queryFn: async (): Promise<MemberDetailDTO[]> => {
      const response = await fetch(getMemberEndpoint(guildId), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<MemberDetailDTO[]>(json);
    },
  });
}

export function useMember(guildId: string, memberId: number) {
  return useQuery({
    queryKey: ["members", guildId, memberId],
    queryFn: async (): Promise<MemberDetailDTO> => {
      const response = await fetch(
        `${getMemberEndpoint(guildId)}/${memberId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<MemberDetailDTO>(json);
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      memberId,
      dto,
    }: {
      guildId: string;
      memberId: number;
      dto: UpdateMemberDTO;
    }): Promise<MemberDetailDTO> => {
      const response = await fetch(
        `${getMemberEndpoint(guildId)}/${memberId}`,
        {
          method: "PATCH",
          headers: getAuthHeadersForMutation(),
          body: JSON.stringify(toSnakeCase(dto)),
        },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<MemberDetailDTO>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members", variables.guildId],
      });
      queryClient.invalidateQueries({
        queryKey: ["members", variables.guildId, variables.memberId],
      });
      queryClient.invalidateQueries({
        queryKey: ["presetMembers", variables.guildId],
      });
    },
  });
}
