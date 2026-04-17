import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/preact-query";
import type { MemberDetailDTO } from "@dtos/member";
import { Role } from "@dtos/member";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import { getMember, getMembers, getMyMember, updateMember } from "@apis/member";
import { queryKeys, queryStaleTimes } from "@utils/query";
import type { AppError } from "@utils/error";

export function useMyMember(
  guildId: string,
): UseQueryResult<MemberDetailDTO, AppError> {
  return useQuery({
    queryKey: queryKeys.myMember(guildId),
    queryFn: (): Promise<MemberDetailDTO> => getMyMember(guildId),
    staleTime: queryStaleTimes.interactive,
  });
}

export function useMembers(
  guildId: string,
): UseQueryResult<MemberDetailDTO[], AppError> {
  return useQuery({
    queryKey: queryKeys.members(guildId),
    queryFn: (): Promise<MemberDetailDTO[]> => getMembers(guildId),
    staleTime: queryStaleTimes.interactive,
  });
}

export function useMember(
  guildId: string,
  memberId: number,
): UseQueryResult<MemberDetailDTO, AppError> {
  return useQuery({
    queryKey: queryKeys.member(guildId, memberId),
    queryFn: (): Promise<MemberDetailDTO> => getMember(guildId, memberId),
    staleTime: queryStaleTimes.interactive,
  });
}

export function useUpdateMember(): UseMutationResult<
  Awaited<ReturnType<typeof updateMember>>,
  AppError,
  Parameters<typeof updateMember>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMember,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<MemberDetailDTO[]>(
        queryKeys.members(variables.guildId),
        (old) => old?.map((m) => (m.memberId === data.memberId ? data : m)),
      );
      queryClient.setQueryData<MemberDetailDTO>(
        queryKeys.member(variables.guildId, variables.memberId),
        data,
      );
      queryClient.setQueriesData<PresetMemberDetailDTO[]>(
        { queryKey: queryKeys.presetMembersByGuild(variables.guildId) },
        (old) =>
          old?.map((pm) =>
            pm.member.memberId === data.memberId ? { ...pm, member: data } : pm,
          ),
      );
    },
  });
}

export function useVerifyRole(guildId: string, required: Role): boolean {
  const { data: myMember } = useMyMember(guildId);
  return (myMember?.role ?? Role.VIEWER) >= required;
}
