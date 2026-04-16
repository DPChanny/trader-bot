import { useEffect, useMemo, useState } from "preact/hooks";
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

  const handleAddMember = (memberId: number) => {
    addMemberIdToAdding(memberId);
    createPresetMember.mutate(
      {
        guildId,
        presetId,
        dto: { memberId, tierId: null, isLeader: false },
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
              <Error error={presetMembersError} />
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
        </SecondarySection>

        <SecondarySection fill>
          <Title>멤버 목록</Title>
          {membersError ? (
            <TertiarySection fill>
              <Error error={membersError} />
            </TertiarySection>
          ) : membersLoading ? (
            <TertiarySection fill>
              <Loading />
            </TertiarySection>
          ) : (
            <>
              {canEdit && createPresetMember.error && (
                <Error error={createPresetMember.error} />
              )}
              <MemberGrid
                members={candidateMembers}
                onMemberClick={canEdit ? handleAddMember : undefined}
              />
            </>
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
