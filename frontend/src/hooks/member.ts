import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { MemberDetailDTO, UpdateMemberDTO } from "@/dtos/memberDto";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { getMemberEndpoint } from "@/utils/env";
import { handleHttpError } from "@/utils/hook";

export function useMembers(guildId: string | null) {
  return useQuery({
    queryKey: ["members", guildId],
    queryFn: async (): Promise<MemberDetailDTO[]> => {
      const response = await fetch(getMemberEndpoint(guildId!), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<MemberDetailDTO[]>(json);
    },
    enabled: !!guildId,
  });
}

export function useMember(guildId: string | null, memberId: number | null) {
  return useQuery({
    queryKey: ["members", guildId, memberId],
    queryFn: async (): Promise<MemberDetailDTO> => {
      const response = await fetch(
        `${getMemberEndpoint(guildId!)}/${memberId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      if (!response.ok) await handleHttpError(response);
      const json = await response.json();
      return toCamelCase<MemberDetailDTO>(json);
    },
    enabled: !!guildId && !!memberId,
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
        queryKey: ["preset", variables.guildId],
      });
    },
  });
}

export function useDeleteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      memberId,
    }: {
      guildId: string;
      memberId: number;
    }): Promise<void> => {
      const response = await fetch(
        `${getMemberEndpoint(guildId)}/${memberId}`,
        {
          method: "DELETE",
          headers: getAuthHeadersForMutation(),
        },
      );
      if (!response.ok) await handleHttpError(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members", variables.guildId],
      });
      queryClient.removeQueries({
        queryKey: ["members", variables.guildId, variables.memberId],
      });
      queryClient.invalidateQueries({ queryKey: ["preset"] });
      queryClient.removeQueries({ queryKey: ["lol", variables.memberId] });
      queryClient.removeQueries({ queryKey: ["val", variables.memberId] });
    },
  });
}
