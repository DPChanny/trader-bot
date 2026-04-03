import { useMemo, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { usePresetDetail, usePresets } from "@/hooks/preset";
import { useMembers } from "@/hooks/member";
import { useGuildContext } from "@/contexts/guildContext";
import { PresetPageProvider, usePresetPageContext } from "./presetContext";
import { PresetList } from "./presetList";
import { TierList } from "./tier/tierList";
import { PositionList } from "./position/positionList";
import { PresetMemberEditor } from "./presetMemberEditor";
import { AddPresetModal } from "./addPresetModal";
import { MemberCandidateGrid } from "./memberCandidateGrid";
import { PresetMemberGrid } from "@/components/presetMemberGrid";
import { Section } from "@/components/commons/section";
import { PageContainer, PageLayout } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import styles from "@/styles/pages/preset/presetPage.module.css";

interface PresetPageProps {
  path?: string;
}

function PresetPageContent() {
  const { guild } = useGuildContext();
  const guildId = guild?.guildId ?? null;
  const {
    selectedPresetId,
    selectedPresetMemberId,
    setSelectedPresetMemberId,
    removingMemberIds,
  } = usePresetPageContext();

  const {
    data: presetDetail,
    isLoading: detailLoading,
    error: detailError,
  } = usePresetDetail(guildId, selectedPresetId);

  const { data: presets, isLoading: presetsLoading } = usePresets(guildId);
  const { data: members } = useMembers(guildId);

  useEffect(() => {
    if (!guild) {
      route("/guild", true);
    }
  }, []);

  const {
    addingMemberIds,
    removeMemberIdFromAdding,
    removeMemberIdFromRemoving,
  } = usePresetPageContext();

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
    const presetMemberIds = new Set(
      presetDetail.presetMembers.map((pm) => pm.memberId),
    );

    addingMemberIds.forEach((memberId) => {
      if (presetMemberIds.has(memberId)) removeMemberIdFromAdding(memberId);
    });
    removingMemberIds.forEach((memberId) => {
      if (!presetMemberIds.has(memberId)) removeMemberIdFromRemoving(memberId);
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

  if (!guild) return null;

  return (
    <PageLayout>
      <PageContainer>
        <Section variantIntent="primary" className={styles.panelSection}>
          {detailError && (
            <Error detail={detailError?.message}>
              프리셋의 상세 정보를 불러오는데 실패했습니다.
            </Error>
          )}
          <PresetList
            presets={presets ?? []}
            presetMembers={presetDetail?.presetMembers}
            isLoading={presetsLoading}
          />
        </Section>

        <Section variantIntent="primary" className={styles.presetDetailSection}>
          {selectedPresetId &&
          !detailLoading &&
          presetDetail &&
          !detailError ? (
            <>
              <Section variantTone="ghost" variantLayout="row">
                <Section
                  variantIntent="secondary"
                  className={styles.tierSection}
                >
                  <TierList tiers={presetDetail.tiers || []} />
                </Section>
                <Section
                  variantIntent="secondary"
                  className={styles.positionSection}
                >
                  <PositionList positions={presetDetail.positions || []} />
                </Section>
              </Section>
              <Section
                variantIntent="secondary"
                className={styles.memberGridSection}
              >
                <PresetMemberGrid
                  presetMembers={presetDetail.presetMembers.filter(
                    (pm) => !removingMemberIds.has(pm.memberId),
                  )}
                  selectedMemberId={selectedPresetMemberId}
                  onMemberClick={(id: number) => setSelectedPresetMemberId(id)}
                />
              </Section>
              <Section
                variantIntent="secondary"
                className={styles.memberGridSection}
              >
                <MemberCandidateGrid members={candidateMembers} />
              </Section>
            </>
          ) : selectedPresetId && detailLoading ? (
            <Loading />
          ) : (
            <div />
          )}
        </Section>

        {selectedPresetMember && presetDetail && (
          <PresetMemberEditor
            key={selectedPresetMember.presetMemberId}
            presetMember={selectedPresetMember}
            tiers={presetDetail.tiers || []}
            positions={presetDetail.positions || []}
            statistics={presetDetail.statistics ?? "NONE"}
          />
        )}
      </PageContainer>

      <AddPresetModal />
    </PageLayout>
  );
}

export function PresetPage({}: PresetPageProps) {
  return (
    <PresetPageProvider>
      <PresetPageContent />
    </PresetPageProvider>
  );
}
