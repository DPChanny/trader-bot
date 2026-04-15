import { useEffect, useMemo, useState } from "preact/hooks";
import { useMembers } from "@hooks/member";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { useCreatePresetMember, usePresetMembers } from "@hooks/presetMember";
import { MemberGrid } from "@components/memberGrid";
import { PresetMemberGrid } from "@components/presetMemberGrid";
import { PresetMemberPanel } from "./presetMemberPanel";
import { Loading } from "@components/molecules/loading";
import { ErrorMessage } from "@components/molecules/errorMessage";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { Column, Row } from "@components/atoms/layout";

interface PresetMemberEditorProps {
  guildId: string;
  presetId: number;
}

export function PresetMemberEditor({
  guildId,
  presetId,
}: PresetMemberEditorProps) {
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

  const handleAddMember = async (memberId: number) => {
    addMemberIdToAdding(memberId);
    try {
      await createPresetMember.mutateAsync({
        guildId,
        presetId,
        dto: { memberId, tierId: null, isLeader: false },
      });
    } catch (err) {
      console.error("Failed to add member:", err);
      removeMemberIdFromAdding(memberId);
    }
  };

  return (
    <>
      <PrimarySection fill minSize>
        {presetMembersError ? (
          <TertiarySection fill>
            <ErrorMessage error={presetMembersError}>
              프리셋 멤버 목록을 불러오는데 실패했습니다.
            </ErrorMessage>
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
            onMemberClick={(id: number) => setSelectedPresetMemberId(id)}
          />
        )}

        {membersError ? (
          <TertiarySection fill>
            <ErrorMessage error={membersError}>
              멤버 목록을 불러오는데 실패했습니다.
            </ErrorMessage>
          </TertiarySection>
        ) : membersLoading ? (
          <TertiarySection fill>
            <Loading />
          </TertiarySection>
        ) : (
          <>
            {canEdit && createPresetMember.isError && (
              <ErrorMessage error={createPresetMember.error}>
                프리셋 멤버 추가에 실패했습니다.
              </ErrorMessage>
            )}
            <MemberGrid
              members={candidateMembers}
              onMemberClick={canEdit ? handleAddMember : undefined}
            />
          </>
        )}
      </PrimarySection>

      {selectedPresetMember && (
        <PresetMemberPanel
          key={selectedPresetMember.presetMemberId}
          presetMember={selectedPresetMember}
          setSelectedPresetMemberId={setSelectedPresetMemberId}
          addMemberIdToRemoving={addMemberIdToRemoving}
          removeMemberIdFromRemoving={removeMemberIdFromRemoving}
        />
      )}
    </>
  );
}
