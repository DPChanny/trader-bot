import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { MemberDetailDTO } from "@features/member/dto";
import { Role } from "@features/member/dto";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";
import type { CursorPageDTO } from "@utils/dto";
import {
  getMember,
  getMembers,
  getMyMember,
  updateMember,
} from "@features/member/api";
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

export function useInfiniteMembers(
  guildId: string,
  search?: string,
): UseInfiniteQueryResult<
  InfiniteData<CursorPageDTO<MemberDetailDTO>>,
  AppError
> {
  return useInfiniteQuery({
    queryKey: queryKeys.members(guildId, search),
    queryFn: ({ pageParam }) =>
      getMembers({ guildId, search, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
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
      queryClient.setQueriesData<InfiniteData<CursorPageDTO<MemberDetailDTO>>>(
        { queryKey: ["members", variables.guildId] },
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  items: page.items.map((m) =>
                    m.memberId === data.memberId ? data : m,
                  ),
                })),
              }
            : old,
      );
      queryClient.setQueryData<MemberDetailDTO>(
        queryKeys.member(variables.guildId, variables.memberId),
        data,
      );
      queryClient.setQueryData<MemberDetailDTO>(
        queryKeys.myMember(variables.guildId),
        (old) => (old?.memberId === data.memberId ? data : old),
      );
      queryClient.setQueriesData<
        InfiniteData<CursorPageDTO<PresetMemberDetailDTO>>
      >(
        { queryKey: queryKeys.presetMembersGuildScope(variables.guildId) },
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  items: page.items.map((pm) =>
                    pm.member.memberId === data.memberId
                      ? { ...pm, member: data }
                      : pm,
                  ),
                })),
              }
            : old,
      );
      queryClient.setQueriesData<PresetMemberDetailDTO>(
        { queryKey: ["presetMember", variables.guildId] as const },
        (old) =>
          old?.member.memberId === data.memberId
            ? { ...old, member: data }
            : old,
      );
    },
  });
}

export function useVerifyRole(guildId: string, required: Role): boolean {
  const { data: myMember } = useMyMember(guildId);
  return (myMember?.role ?? Role.VIEWER) >= required;
}
