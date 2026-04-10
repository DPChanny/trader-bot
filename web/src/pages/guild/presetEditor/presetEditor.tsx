import { useEffect, useMemo, useState } from "preact/hooks";
import { usePresetDetail } from "@/hooks/preset";
import { useMembers } from "@/hooks/member";
import { useAddAuction } from "@/hooks/auction";
import { TierEditor } from "./tierEditor/tierEditor";
import { PositionEditor } from "./positionEditor/positionEditor";
import { PresetMemberPanel } from "./presetMember/presetMemberPanel";
import { MemberCandidateGrid } from "./presetMember/memberCandidateGrid";
import { PresetMemberGrid } from "@/components/presetMemberGrid";
import { Section } from "@/components/commons/section";
import { PageContainer, PageLayout } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { PrimaryButton } from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import styles from "@/styles/pages/guild/presetEditor/presetPage.module.css";

interface PresetEditorProps {
  guildId: string;
  presetId: number | null;
}

export function PresetEditor({ guildId, presetId }: PresetEditorProps) {
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

  const addAuction = useAddAuction();

  const {
    data: presetDetail,
    isLoading: detailLoading,
    error: detailError,
  } = usePresetDetail(guildId, presetId);

  const { data: members } = useMembers(guildId);

  const presetMemberIds = useMemo(
    () => new Set(presetDetail?.presetMembers.map((pm) => pm.memberId) ?? []),
    [presetDetail],
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
    if (!presetDetail) return;
    const ids = new Set(presetDetail.presetMembers.map((pm) => pm.memberId));
    addingMemberIds.forEach((memberId) => {
      if (ids.has(memberId)) removeMemberIdFromAdding(memberId);
    });
    removingMemberIds.forEach((memberId) => {
      if (!ids.has(memberId)) removeMemberIdFromRemoving(memberId);
    });
  }, [presetDetail]);

  const selectedPresetMember = useMemo(
    () =>
      selectedPresetMemberId && presetDetail
        ? presetDetail.presetMembers.find(
            (pm) => pm.presetMemberId === selectedPresetMemberId,
          )
        : null,
    [selectedPresetMemberId, presetDetail],
  );

  const presetMembers = presetDetail?.presetMembers ?? [];
  const leaderCount = presetMembers.filter((pm) => pm.isLeader).length;
  const memberCount = presetMembers.length;
  const requiredMembers = leaderCount * 5;
  const canStartAuction = leaderCount >= 2;

  let presetValidMessage = "";
  if (presetId && presetDetail) {
    if (leaderCount < 2) {
      presetValidMessage = `현재 팀장 인원(${leaderCount}명)이 최소 인원(2명)보다 적습니다.`;
    } else if (memberCount < requiredMembers) {
      presetValidMessage = `현재 인원(${memberCount}명)이 권장 인원(${requiredMembers}명)보다 적습니다.`;
    }
  }

  const handleStartAuction = async () => {
    if (!presetId) return;
    try {
      await addAuction.mutateAsync(presetId);
    } catch {}
  };

  return (
    <PageLayout>
      <PageContainer>
        <Section variantIntent="primary" className={styles.panelSection}>
          {detailError && (
            <Error detail={detailError?.message}>
              프리셋의 상세 정보를 불러오는데 실패했습니다.
            </Error>
          )}
          {presetId ? (
            <>
              <Section variantIntent="secondary" className={styles.tierSection}>
                <TierEditor
                  guildId={guildId}
                  presetId={presetId}
                  tiers={presetDetail?.tiers || []}
                />
              </Section>
              <Section
                variantIntent="secondary"
                className={styles.positionSection}
              >
                <PositionEditor
                  guildId={guildId}
                  presetId={presetId}
                  positions={presetDetail?.positions || []}
                />
              </Section>
            </>
          ) : null}
          <Bar />
          <Section variantTone="ghost" variantIntent="secondary">
            <PrimaryButton
              onClick={handleStartAuction}
              disabled={
                addAuction.isPending ||
                !canStartAuction ||
                !presetId ||
                !presetDetail
              }
            >
              {addAuction.isPending ? "경매 생성 중" : "경매 생성"}
            </PrimaryButton>
            {presetValidMessage && <Error>{presetValidMessage}</Error>}
            {addAuction.isError && (
              <Error detail={addAuction.error?.message}>
                경매를 시작하는데 실패했습니다.
              </Error>
            )}
          </Section>
        </Section>

        <Section variantIntent="primary" className={styles.presetDetailSection}>
          {presetId && !detailLoading && presetDetail && !detailError ? (
            <>
              <Section
                variantIntent="secondary"
                className={styles.memberGridSection}
              >
                <PresetMemberGrid
                  presetMembers={presetDetail.presetMembers.filter(
                    (pm) => !removingMemberIds.has(pm.memberId),
                  )}
                  tiers={presetDetail.tiers}
                  positions={presetDetail.positions}
                  selectedMemberId={selectedPresetMemberId}
                  onMemberClick={(id: number) => setSelectedPresetMemberId(id)}
                />
              </Section>
              <Section
                variantIntent="secondary"
                className={styles.memberGridSection}
              >
                <MemberCandidateGrid
                  guildId={guildId}
                  presetId={presetId}
                  members={candidateMembers}
                  addingMemberIds={addingMemberIds}
                  addMemberIdToAdding={addMemberIdToAdding}
                  removeMemberIdFromAdding={removeMemberIdFromAdding}
                />
              </Section>
            </>
          ) : presetId && detailLoading ? (
            <Loading />
          ) : (
            <div />
          )}
        </Section>

        {selectedPresetMember && presetDetail && (
          <PresetMemberPanel
            key={selectedPresetMember.presetMemberId}
            guildId={guildId}
            presetId={presetId!}
            presetMember={selectedPresetMember}
            tiers={presetDetail.tiers || []}
            positions={presetDetail.positions || []}
            setSelectedPresetMemberId={setSelectedPresetMemberId}
            addMemberIdToRemoving={addMemberIdToRemoving}
            removeMemberIdFromRemoving={removeMemberIdFromRemoving}
          />
        )}
      </PageContainer>
    </PageLayout>
  );
}
