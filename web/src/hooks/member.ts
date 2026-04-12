import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { MemberDetailDTO, UpdateMemberDTO } from "@/dtos/memberDto";
import { Role } from "@/dtos/memberDto";
import {
  getMember,
  getMembers,
  getMyMember,
  updateMember,
} from "@/apis/member";
import { queryKeys } from "@/utils/query";

export function useMyMember(guildId: string) {
  return useQuery({
    queryKey: queryKeys.myMember(guildId),
    queryFn: (): Promise<MemberDetailDTO> => getMyMember(guildId),
  });
}

export function useMembers(guildId: string) {
  return useQuery({
    queryKey: queryKeys.members(guildId),
    queryFn: (): Promise<MemberDetailDTO[]> => getMembers(guildId),
  });
}

export function useMember(guildId: string, memberId: number) {
  return useQuery({
    queryKey: queryKeys.member(guildId, memberId),
    queryFn: (): Promise<MemberDetailDTO> => getMember(guildId, memberId),
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
    }): Promise<MemberDetailDTO> => updateMember({ guildId, memberId, dto }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.members(variables.guildId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.member(variables.guildId, variables.memberId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.presetMembersByGuild(variables.guildId),
      });
    },
  });
}

export function useVerifyRole(guildId: string, required: Role): boolean {
  const { data: myMember } = useMyMember(guildId);
  return (myMember?.role ?? Role.VIEWER) >= required;
}
