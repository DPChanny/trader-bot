import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/preact-query";
import type { MemberDetailDTO } from "@/dtos/memberDto";
import { Role } from "@/dtos/memberDto";
import {
  getMember,
  getMembers,
  getMyMember,
  updateMember,
} from "@/apis/member";
import { queryKeys } from "@/utils/query";

type UpdateMemberVariables = Parameters<typeof updateMember>[0];
type UpdateMemberResult = Awaited<ReturnType<typeof updateMember>>;

export function useMyMember(
  guildId: string,
): UseQueryResult<MemberDetailDTO, Error> {
  return useQuery({
    queryKey: queryKeys.myMember(guildId),
    queryFn: (): Promise<MemberDetailDTO> => getMyMember(guildId),
  });
}

export function useMembers(
  guildId: string,
): UseQueryResult<MemberDetailDTO[], Error> {
  return useQuery({
    queryKey: queryKeys.members(guildId),
    queryFn: (): Promise<MemberDetailDTO[]> => getMembers(guildId),
  });
}

export function useMember(
  guildId: string,
  memberId: number,
): UseQueryResult<MemberDetailDTO, Error> {
  return useQuery({
    queryKey: queryKeys.member(guildId, memberId),
    queryFn: (): Promise<MemberDetailDTO> => getMember(guildId, memberId),
  });
}

export function useUpdateMember(): UseMutationResult<
  UpdateMemberResult,
  Error,
  UpdateMemberVariables,
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMember,
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
