import { useEffect, useMemo, useState } from "react";
import { useGuildId, usePresetId } from "@hooks/route";
import { useMembers } from "@features/member/hook";
import { Role } from "@features/member/dto";
import { useVerifyRole } from "@features/member/hook";
import {
  useCreatePresetMember,
  useDeletePresetMember,
  usePresetMembers,
} from "@features/presetMember/hook";
import { MemberGrid } from "@components/memberGrid";
import { PresetMemberGrid } from "@components/presetMemberGrid";
import { PresetMemberPanel } from "./presetMemberPanel";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Title } from "@components/atoms/text";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";

export function PresetMemberEditor() {
  const guildId = useGuildId();
  const presetId = usePresetId();
  const [selectedPresetMemberId, setSelectedPresetMemberId] = useState<
    number | null
  >(null);
  const [addingMemberIds, setAddingMemberIds] = useState<Set<number>>(
    new Set(),
  );
  const [removingMemberIds, setRemovingMemberIds] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    setSelectedPresetMemberId(null);
    setAddingMemberIds(new Set());
    setRemovingMemberIds(new Set());
  }, [presetId]);

  const addMemberIdToAdding = (id: number) =>
    setAddingMemberIds((prev) => new Set(prev).add(id));
  const removeMemberIdFromAdding = (id: number) =>
    setAddingMemberIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  const addMemberIdToRemoving = (id: number) =>
    setRemovingMemberIds((prev) => new Set(prev).add(id));
  const removeMemberIdFromRemoving = (id: number) =>
    setRemovingMemberIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const {
    data: presetMembers,
    isLoading: presetMembersLoading,
    error: presetMembersError,
  } = usePresetMembers(guildId, presetId);
  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
  } = useMembers(guildId);

  const createPresetMember = useCreatePresetMember();
  const deletePresetMember = useDeletePresetMember();
  const canManage = useVerifyRole(guildId, Role.ADMIN);

  const presetMemberIds = useMemo(
    () => new Set(presetMembers?.map((pm) => pm.memberId) ?? []),
    [presetMembers],
  );

  const candidateMembers = useMemo(
    () =>
      members?.filter(
        (m) =>
          !presetMemberIds.has(m.memberId) && !addingMemberIds.has(m.memberId),
      ) ?? [],
    [members, presetMemberIds, addingMemberIds],
  );

  useEffect(() => {
    if (!presetMembers) return;
    const ids = new Set(presetMembers.map((pm) => pm.memberId));
    addingMemberIds.forEach((memberId) => {
      if (ids.has(memberId)) removeMemberIdFromAdding(memberId);
    });
    removingMemberIds.forEach((memberId) => {
      if (!ids.has(memberId)) removeMemberIdFromRemoving(memberId);
    });
  }, [presetMembers]);

  const selectedPresetMember = useMemo(
    () =>
      selectedPresetMemberId !== null && presetMembers
        ? presetMembers.find(
            (pm) => pm.presetMemberId === selectedPresetMemberId,
          )
        : null,
    [selectedPresetMemberId, presetMembers],
  );

  const handleAddMember = (memberId: number) => {
    addMemberIdToAdding(memberId);
    createPresetMember.mutate(
      {
        guildId,
        presetId,
        dto: { memberId, tierId: null, isLeader: false, infoUrl: null },
      },
      {
        onError: () => {
          removeMemberIdFromAdding(memberId);
        },
      },
    );
  };

  const handleRemovePresetMember = (presetMember: PresetMemberDetailDTO) => {
    if (deletePresetMember.isPending) return;

    addMemberIdToRemoving(presetMember.memberId);
    setSelectedPresetMemberId((prev) =>
      prev === presetMember.presetMemberId ? null : prev,
    );

    deletePresetMember.mutate(
      {
        guildId,
        presetId,
        presetMemberId: presetMember.presetMemberId,
      },
      {
        onError: () => {
          removeMemberIdFromRemoving(presetMember.memberId);
        },
      },
    );
  };

  const handlePresetMemberClick = (
    presetMember: PresetMemberDetailDTO,
    event: MouseEvent,
  ) => {
    if (canManage && (event.ctrlKey || event.shiftKey || event.metaKey)) {
      handleRemovePresetMember(presetMember);
      return;
    }

    setSelectedPresetMemberId(presetMember.presetMemberId);
  };

  return (
    <>
      <PrimarySection minSize fill>
        <SecondarySection minSize fill>
          <Title>프리셋 멤버 목록</Title>
          {presetMembersError ? (
            <TertiarySection fill>
              <Error error={presetMembersError}>
                프리셋 멤버 목록을 불러오지 못했습니다
              </Error>
            </TertiarySection>
          ) : presetMembersLoading ? (
            <TertiarySection fill>
              <Loading />
            </TertiarySection>
          ) : (
            <PresetMemberGrid
              presetMembers={
                presetMembers?.filter(
                  (pm) => !removingMemberIds.has(pm.memberId),
                ) ?? []
              }
              selectedMemberId={selectedPresetMemberId}
              onClick={handlePresetMemberClick}
            />
          )}
        </SecondarySection>

        {canManage && createPresetMember.error && (
          <Error error={createPresetMember.error}>
            프리셋 멤버 추가에 실패했습니다
          </Error>
        )}

        {canManage && deletePresetMember.error && (
          <Error error={deletePresetMember.error}>
            프리셋 멤버 제거에 실패했습니다
          </Error>
        )}

        <SecondarySection minSize fill>
          <Title>멤버 목록</Title>
          {membersError ? (
            <TertiarySection fill>
              <Error error={membersError}>
                서버 멤버 목록을 불러오지 못했습니다
              </Error>
            </TertiarySection>
          ) : membersLoading ? (
            <TertiarySection fill>
              <Loading />
            </TertiarySection>
          ) : (
            <MemberGrid
              members={candidateMembers}
              onClick={canManage ? handleAddMember : undefined}
            />
          )}
        </SecondarySection>
      </PrimarySection>

      {selectedPresetMember && (
        <PresetMemberPanel
          key={selectedPresetMember.presetMemberId}
          presetMember={selectedPresetMember}
          onClose={() => setSelectedPresetMemberId(null)}
          onRemoveStart={addMemberIdToRemoving}
          onRemoveRollback={removeMemberIdFromRemoving}
        />
      )}
    </>
  );
}
