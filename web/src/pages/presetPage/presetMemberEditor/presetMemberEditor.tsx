import { useEffect, useMemo, useState } from "preact/hooks";
import { useMembers } from "@/hooks/member";
import { Role } from "@/dtos/memberDto";
import { useVerifyRole } from "@/hooks/member";
import { useCreatePresetMember, usePresetMembers } from "@/hooks/presetMember";
import { MemberGrid } from "@/components/memberGrid";
import { PresetMemberGrid } from "@/components/presetMemberGrid";
import { PresetMemberPanel } from "./presetMemberPanel";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { Section } from "@/components/commons/section";
import styles from "@/styles/pages/presetPage/presetMemberEditor/presetMemberEditor.module.css";

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
    <Section variantIntent="primary" className={styles.editorLayout}>
      <Section
        variantTone="ghost"
        variantLayout="column"
        className={styles.gridsColumn}
      >
        <Section variantIntent="secondary" className={styles.gridSection}>
          {presetMembersError ? (
            <Error detail={presetMembersError?.message}>
              프리셋 멤버 목록을 불러오는데 실패했습니다.
            </Error>
          ) : presetMembersLoading ? (
            <Loading />
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
        </Section>

        <Section variantIntent="secondary" className={styles.gridSection}>
          {membersError ? (
            <Error detail={membersError?.message}>
              멤버 목록을 불러오는데 실패했습니다.
            </Error>
          ) : membersLoading ? (
            <Loading />
          ) : (
            <>
              {canEdit && createPresetMember.isError && (
                <Error detail={createPresetMember.error?.message}>
                  멤버를 프리셋에 추가하는데 실패했습니다.
                </Error>
              )}
              <MemberGrid
                members={candidateMembers}
                onMemberClick={canEdit ? handleAddMember : undefined}
              />
            </>
          )}
        </Section>
      </Section>

      {selectedPresetMember && (
        <PresetMemberPanel
          key={selectedPresetMember.presetMemberId}
          presetMember={selectedPresetMember}
          setSelectedPresetMemberId={setSelectedPresetMemberId}
          addMemberIdToRemoving={addMemberIdToRemoving}
          removeMemberIdFromRemoving={removeMemberIdFromRemoving}
        />
      )}
    </Section>
  );
}
