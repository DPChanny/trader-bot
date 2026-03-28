import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { Member } from "@/dto";
import { GUILD_API_ENDPOINT } from "@/env";
import { getAuthHeaders, getAuthHeadersForMutation } from "@/utils/auth";
import { toCamelCase, toSnakeCase } from "@/utils/dto";
import { throwHttpError } from "@/utils/fetch";

interface AddMemberData {
  alias?: string | null;
  riotId?: string | null;
  discordId?: string | null;
}

interface UpdateMemberData {
  alias?: string | null;
  riotId?: string | null;
  discordId?: string | null;
}

function memberEndpoint(guildId: number) {
  return `${GUILD_API_ENDPOINT}/${guildId}/member`;
}

export function useMembers(guildId: number | null) {
  return useQuery({
    queryKey: ["members", guildId],
    queryFn: async (): Promise<Member[]> => {
      const response = await fetch(memberEndpoint(guildId!), {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await throwHttpError(response);
      const json = await response.json();
      return toCamelCase<Member[]>(json);
    },
    enabled: !!guildId,
  });
}

export function useMember(guildId: number | null, memberId: number | null) {
  return useQuery({
    queryKey: ["members", guildId, memberId],
    queryFn: async (): Promise<Member> => {
      const response = await fetch(`${memberEndpoint(guildId!)}/${memberId}`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) await throwHttpError(response);
      const json = await response.json();
      return toCamelCase<Member>(json);
    },
    enabled: !!guildId && !!memberId,
  });
}

export function useAddMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      data,
    }: {
      guildId: number;
      data: AddMemberData;
    }): Promise<Member> => {
      const response = await fetch(memberEndpoint(guildId), {
        method: "POST",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) await throwHttpError(response);
      const json = await response.json();
      return toCamelCase<Member>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members", variables.guildId],
      });
    },
  });
}

export function useUpdateMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      memberId,
      data,
    }: {
      guildId: number;
      memberId: number;
      data: UpdateMemberData;
    }): Promise<Member> => {
      const response = await fetch(`${memberEndpoint(guildId)}/${memberId}`, {
        method: "PATCH",
        headers: getAuthHeadersForMutation(),
        body: JSON.stringify(toSnakeCase(data)),
      });
      if (!response.ok) await throwHttpError(response);
      const json = await response.json();
      return toCamelCase<Member>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members", variables.guildId],
      });
      queryClient.invalidateQueries({
        queryKey: ["members", variables.guildId, variables.memberId],
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
      guildId: number;
      memberId: number;
    }): Promise<void> => {
      const response = await fetch(`${memberEndpoint(guildId)}/${memberId}`, {
        method: "DELETE",
        headers: getAuthHeadersForMutation(),
      });
      if (!response.ok) await throwHttpError(response);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members", variables.guildId],
      });
      queryClient.removeQueries({
        queryKey: ["members", variables.guildId, variables.memberId],
      });
      queryClient.invalidateQueries({ queryKey: ["preset"] });
    },
  });
}

export function useUpdateMemberProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      guildId,
      memberId,
    }: {
      guildId: number;
      memberId: number;
    }): Promise<Member> => {
      const response = await fetch(
        `${memberEndpoint(guildId)}/${memberId}/profile`,
        {
          method: "POST",
          headers: getAuthHeadersForMutation(),
        },
      );
      if (!response.ok) await throwHttpError(response);
      const json = await response.json();
      return toCamelCase<Member>(json);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["members", variables.guildId],
      });
      queryClient.invalidateQueries({
        queryKey: ["members", variables.guildId, variables.memberId],
      });
    },
  });
}
