import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import type { MemberDetailDTO, UpdateMemberDTO } from "@/dtos/memberDto";
import { getMember, getMembers, getMyMember, updateMember } from "@/apis/member";

export function useMyMember(guildId: string) {
  return useQuery({
    queryKey: ["members", guildId, "me"],
    queryFn: (): Promise<MemberDetailDTO> => getMyMember(guildId),
  });
}

export function useMembers(guildId: string) {
  return useQuery({
    queryKey: ["members", guildId],
    queryFn: (): Promise<MemberDetailDTO[]> => getMembers(guildId),
  });
}

export function useMember(guildId: string, memberId: number) {
  return useQuery({
    queryKey: ["members", guildId, memberId],
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
