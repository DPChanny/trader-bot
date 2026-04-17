import { useEffect, useMemo, useState } from "preact/hooks";
import { useGuildId, usePresetId } from "@hooks/router";
import { useMembers } from "@hooks/member";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { useCreatePresetMember, usePresetMembers } from "@hooks/presetMember";
import { MemberGrid } from "@components/memberGrid";
import { PresetMemberGrid } from "@components/presetMemberGrid";
import { PresetMemberPanel } from "./presetMemberPanel";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { Title } from "@components/atoms/text";
import { FlexItem } from "@components/atoms/layout";

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
  const canEdit = useVerifyRole(guildId, Role.EDITOR);

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

  return (
    <>
      <PrimarySection fill minSize>
        <SecondarySection fill>
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
              onClick={(id: number) => setSelectedPresetMemberId(id)}
            />
          )}
        </SecondarySection>

        {canEdit && createPresetMember.error && (
          <Error error={createPresetMember.error}>
            프리셋 멤버 추가에 실패했습니다
          </Error>
        )}

        <SecondarySection fill>
          <Title>멤버 목록</Title>
          {membersError ? (
            <TertiarySection fill>
              <Error error={membersError}>
                길드 멤버 목록을 불러오지 못했습니다
              </Error>
            </TertiarySection>
          ) : membersLoading ? (
            <TertiarySection fill>
              <Loading />
            </TertiarySection>
          ) : (
            <MemberGrid
              members={candidateMembers}
              onClick={canEdit ? handleAddMember : undefined}
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
