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
import {
  getPresetMembers,
  getPresetMember,
  createPresetMember,
  updatePresetMember,
  deletePresetMember,
} from "@features/presetMember/api";
import { queryKeys, queryStaleTimes } from "@utils/query";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";
import type { CursorPageDTO } from "@utils/dto";
import type { AppError } from "@utils/error";

function invalidatePresetMemberQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  guildId: string,
  presetId: number,
): void {
  void queryClient.invalidateQueries({
    queryKey: queryKeys.presetMembers(guildId, presetId),
  });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.presetMemberPresetScope(guildId, presetId),
  });
}

export function useInfinitePresetMembers(
  guildId: string,
  presetId: number,
  search?: string,
): UseInfiniteQueryResult<
  InfiniteData<CursorPageDTO<PresetMemberDetailDTO>>,
  AppError
> {
  return useInfiniteQuery({
    queryKey: queryKeys.presetMembers(guildId, presetId, search),
    queryFn: ({ pageParam }) =>
      getPresetMembers({ guildId, presetId, search, cursor: pageParam }),
    initialPageParam: undefined as number | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: queryStaleTimes.interactive,
  });
}

export function usePresetMember(
  guildId: string,
  presetId: number,
  presetMemberId: number,
): UseQueryResult<PresetMemberDetailDTO, AppError> {
  return useQuery({
    queryKey: queryKeys.presetMember(guildId, presetId, presetMemberId),
    queryFn: () => getPresetMember(guildId, presetId, presetMemberId),
    staleTime: queryStaleTimes.interactive,
  });
}

export function useCreatePresetMember(): UseMutationResult<
  Awaited<ReturnType<typeof createPresetMember>>,
  AppError,
  Parameters<typeof createPresetMember>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPresetMember,
    onSuccess: (data, variables) => {
      queryClient.setQueryData<PresetMemberDetailDTO>(
        queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          data.presetMemberId,
        ),
        data,
      );
      invalidatePresetMemberQueries(
        queryClient,
        variables.guildId,
        variables.presetId,
      );
    },
  });
}

export function useUpdatePresetMember(): UseMutationResult<
  Awaited<ReturnType<typeof updatePresetMember>>,
  AppError,
  Parameters<typeof updatePresetMember>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePresetMember,
    onSuccess: (data, variables) => {
      queryClient.setQueriesData<
        InfiniteData<CursorPageDTO<PresetMemberDetailDTO>>
      >(
        { queryKey: ["presetMembers", variables.guildId, variables.presetId] },
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  items: page.items.map((pm) =>
                    pm.presetMemberId === data.presetMemberId ? data : pm,
                  ),
                })),
              }
            : old,
      );
      queryClient.setQueryData<PresetMemberDetailDTO>(
        queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ),
        data,
      );
      invalidatePresetMemberQueries(
        queryClient,
        variables.guildId,
        variables.presetId,
      );
    },
  });
}

export function useDeletePresetMember(): UseMutationResult<
  void,
  AppError,
  Parameters<typeof deletePresetMember>[0],
  unknown
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePresetMember,
    onSuccess: (_, variables) => {
      queryClient.setQueriesData<
        InfiniteData<CursorPageDTO<PresetMemberDetailDTO>>
      >(
        { queryKey: ["presetMembers", variables.guildId, variables.presetId] },
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  items: page.items.filter(
                    (pm) => pm.presetMemberId !== variables.presetMemberId,
                  ),
                })),
              }
            : old,
      );
      queryClient.removeQueries({
        queryKey: queryKeys.presetMember(
          variables.guildId,
          variables.presetId,
          variables.presetMemberId,
        ),
      });
      invalidatePresetMemberQueries(
        queryClient,
        variables.guildId,
        variables.presetId,
      );
    },
  });
}
