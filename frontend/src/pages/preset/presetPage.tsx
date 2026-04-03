import { useState, useEffect, useMemo } from "preact/hooks";
import { route } from "preact-router";
import { useMembers } from "@/hooks/member";
import { useAddPreset, usePresetDetail, usePresets } from "@/hooks/preset";
import { useAddPresetMember } from "@/hooks/presetMember";
import { useAddAuction } from "@/hooks/auction";
import { getGuild } from "@/utils/guild";
import { PresetList } from "./presetList";
import { TierList } from "./tierList";
import { PositionList } from "./positionList";
import { PresetMemberEditor } from "./presetMemberEditor";
import { AddPresetModal } from "./addPresetModal";
import { PrimaryButton } from "@/components/commons/button";
import { MemberGrid } from "@/components/memberGrid";
import { PresetMemberGrid } from "@/components/presetMemberGrid";
import { Section } from "@/components/commons/section";
import { PageContainer, PageLayout } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { Bar } from "@/components/commons/bar";
import type { Statistics } from "@/dtos/presetDto";
import styles from "@/styles/pages/preset/presetPage.module.css";

interface PresetPageProps {
  path?: string;
}

export function PresetPage({}: PresetPageProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<number | null>(null);
  const [selectedPresetMemberId, setSelectedPresetMemberId] = useState<
    number | null
  >(null);
  const [addingMemberIds, setAddingMemberIds] = useState<Set<number>>(
    new Set(),
  );
  const [removingMemberIds, setRemovingMemberIds] = useState<Set<number>>(
    new Set(),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [newPresetName, setNewPresetName] = useState("");
  const [inputPoints, setInputPoints] = useState(1000);
  const [pointScale, setPointScale] = useState(1);
  const [time, setTime] = useState(30);
  const [statistics, setStatistics] = useState<Statistics>("NONE");
  const [showTierForm, setShowTierForm] = useState(false);
  const [newTierName, setNewTierName] = useState("");

  const [showPositionForm, setShowPositionForm] = useState(false);
  const [newPositionName, setNewPositionName] = useState("");
  const [newPositionIconUrl, setNewPositionIconUrl] = useState("");

  const selectedGuild = getGuild();
  const guildId = selectedGuild?.guildId ?? null;

  const {
    data: presets,
    isLoading: presetsLoading,
    error: presetsError,
  } = usePresets(guildId ?? 0);
  const { data: members, error: membersError } = useMembers(guildId ?? 0);
  const {
    data: presetDetail,
    isLoading: detailLoading,
    error: detailError,
  } = usePresetDetail(guildId ?? 0, selectedPresetId);

  const addPresetMember = useAddPresetMember();
  const addPreset = useAddPreset();
  const addAuction = useAddAuction();

  useEffect(() => {
    if (!selectedGuild) {
      route("/guild", true);
    }
  }, []);

  useEffect(() => {
    if (presetDetail) {
      const presetMemberIds = new Set(
        presetDetail.presetMembers.map((pm) => pm.memberId),
      );

      if (addingMemberIds.size > 0) {
        setAddingMemberIds((prev) => {
          const next = new Set(prev);
          let changed = false;
          prev.forEach((memberId) => {
            if (presetMemberIds.has(memberId)) {
              next.delete(memberId);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }

      if (removingMemberIds.size > 0) {
        setRemovingMemberIds((prev) => {
          const next = new Set(prev);
          let changed = false;
          prev.forEach((memberId) => {
            if (!presetMemberIds.has(memberId)) {
              next.delete(memberId);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }
    }
  }, [presetDetail]);

  const handleSelectPreset = (presetId: number) => {
    setSelectedPresetId(presetId);
    setSelectedPresetMemberId(null);
    setAddingMemberIds(new Set());
    setRemovingMemberIds(new Set());
  };

  const isDivisible = inputPoints % pointScale === 0;

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!newPresetName.trim() || pointScale <= 0 || !isDivisible) return;
    const actualPoints = inputPoints / pointScale;
    try {
      await addPreset.mutateAsync({
        guildId: guildId!,
        dto: {
          name: newPresetName.trim(),
          points: actualPoints,
          time,
          pointScale,
          statistics,
        },
      });
      setNewPresetName("");
      setInputPoints(1000);
      setPointScale(1);
      setTime(30);
      setStatistics("NONE");
      setIsCreating(false);
    } catch (err) {
      console.error("Failed to add preset:", err);
    }
  };

  const handleStartAuction = async () => {
    if (!selectedPresetId || !presetDetail) return;

    const leaderCount =
      presetDetail.presetMembers?.filter((pm) => pm.isLeader).length || 0;

    if (leaderCount < 2) {
      return;
    }

    try {
      await addAuction.mutateAsync(selectedPresetId);
    } catch (err) {
      console.error("Failed to start auction:", err);
    }
  };

  const handleClosePresetMemberEditor = () => {
    setSelectedPresetMemberId(null);
  };

  const onPresetDeleted = (deletedId: number) => {
    if (selectedPresetId === deletedId) {
      setSelectedPresetId(null);
    }
  };

  const presetMemberIds = presetDetail
    ? new Set(presetDetail.presetMembers.map((pm) => pm.memberId))
    : new Set<number>();

  const memberGridMembers =
    members?.filter(
      (m) =>
        !presetMemberIds.has(m.memberId) && !addingMemberIds.has(m.memberId),
    ) || [];

  const selectedPresetMember = useMemo(
    () =>
      selectedPresetMemberId && presetDetail
        ? presetDetail.presetMembers.find(
            (pm) => pm.presetMemberId === selectedPresetMemberId,
          )
        : null,
    [selectedPresetMemberId, presetDetail],
  );

  const leaderCount =
    presetDetail?.presetMembers?.filter((pm) => pm.isLeader).length || 0;
  const memberCount = presetDetail?.presetMembers?.length || 0;
  const requiredMembers = leaderCount * 5;
  const canStartAuction = leaderCount >= 2;

  let presetValidMessage = "";
  if (selectedPresetId && presetDetail) {
    if (leaderCount < 2) {
      presetValidMessage = `현재 팀장 인원(${leaderCount}명)이 최소 인원(2명)보다 적습니다.`;
    } else if (memberCount < requiredMembers) {
      presetValidMessage = `현재 인원(${memberCount}명)이 권장 인원(${requiredMembers}명)보다 적습니다.`;
    }
  }

  if (!selectedGuild) return null;

  return (
    <PageLayout>
      <PageContainer>
        <Section variantIntent="primary" className={styles.panelSection}>
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantIntent="secondary"
          >
            <h3>프리셋 목록</h3>
            <PrimaryButton onClick={() => setIsCreating(true)}>
              추가
            </PrimaryButton>
          </Section>
          <Bar />
          {presetsError && (
            <Error detail={presetsError?.message}>
              프리셋 목록을 불러오는데 실패했습니다.
            </Error>
          )}
          {!presetsError && (
            <>
              <PresetList
                guildId={guildId!}
                presets={presets || []}
                selectedPresetId={selectedPresetId}
                onSelectPreset={handleSelectPreset}
                isLoading={presetsLoading}
                onPresetDeleted={onPresetDeleted}
              />
              <Bar />
              <Section variantTone="ghost" variantIntent="secondary">
                <PrimaryButton
                  onClick={handleStartAuction}
                  disabled={
                    addAuction.isPending ||
                    !canStartAuction ||
                    !selectedPresetId ||
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
            </>
          )}
        </Section>

        <Section variantIntent="primary" className={styles.presetDetailSection}>
          {addPresetMember.isError && (
            <Error detail={addPresetMember.error?.message}>
              멤버를 프리셋에 추가하는데 실패했습니다.
            </Error>
          )}
          {detailError && selectedPresetId && (
            <Error detail={detailError?.message}>
              프리셋의 상세 정보를 불러오는데 실패했습니다.
            </Error>
          )}
          {membersError && selectedPresetId && (
            <Error detail={membersError?.message}>
              멤버 목록을 불러오는데 실패했습니다.
            </Error>
          )}
          {selectedPresetId &&
          !detailLoading &&
          presetDetail &&
          !detailError &&
          !membersError ? (
            <>
              <Section variantTone="ghost" variantLayout="row">
                <Section
                  variantIntent="secondary"
                  className={styles.tierSection}
                >
                  <Section variantTone="ghost" variantLayout="row">
                    <h3>티어 목록</h3>
                    <PrimaryButton onClick={() => setShowTierForm(true)}>
                      추가
                    </PrimaryButton>
                  </Section>
                  <Bar />
                  <TierList
                    guildId={guildId!}
                    presetId={presetDetail.presetId}
                    tiers={presetDetail.tiers || []}
                    showTierForm={showTierForm}
                    newTierName={newTierName}
                    onShowTierFormChange={setShowTierForm}
                    onNewTierNameChange={setNewTierName}
                  />
                </Section>
                <Section
                  variantIntent="secondary"
                  className={styles.positionSection}
                >
                  <Section variantTone="ghost" variantLayout="row">
                    <h3>포지션 목록</h3>
                    <PrimaryButton onClick={() => setShowPositionForm(true)}>
                      추가
                    </PrimaryButton>
                  </Section>
                  <Bar />
                  <PositionList
                    guildId={guildId!}
                    presetId={presetDetail.presetId}
                    positions={presetDetail.positions || []}
                    showPositionForm={showPositionForm}
                    newPositionName={newPositionName}
                    newPositionIconUrl={newPositionIconUrl}
                    onShowPositionFormChange={setShowPositionForm}
                    onNewPositionNameChange={setNewPositionName}
                    onNewPositionIconUrlChange={setNewPositionIconUrl}
                  />
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
                <MemberGrid
                  members={memberGridMembers}
                  onMemberClick={async (id: number) => {
                    if (!selectedPresetId || !guildId) return;
                    const memberId = id;
                    setAddingMemberIds((prev) => new Set(prev).add(memberId));
                    try {
                      await addPresetMember.mutateAsync({
                        guildId,
                        presetId: selectedPresetId,
                        dto: { memberId },
                      });
                    } catch (err) {
                      console.error("Failed to add member:", err);
                      setAddingMemberIds((prev) => {
                        const next = new Set(prev);
                        next.delete(memberId);
                        return next;
                      });
                    }
                  }}
                />
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
            guildId={guildId!}
            presetId={presetDetail.presetId}
            statistics={presetDetail.statistics}
            tiers={presetDetail.tiers || []}
            positions={presetDetail.positions || []}
            onClose={handleClosePresetMemberEditor}
            onRemoveStart={(memberId: number) => {
              setRemovingMemberIds((prev) => new Set(prev).add(memberId));
            }}
            onRemoveError={(memberId: number) => {
              setRemovingMemberIds((prev) => {
                const next = new Set(prev);
                next.delete(memberId);
                return next;
              });
            }}
          />
        )}

        <AddPresetModal
          isOpen={isCreating}
          onClose={() => setIsCreating(false)}
          onSubmit={handleSubmit}
          presetName={newPresetName}
          onNameChange={setNewPresetName}
          inputPoints={inputPoints}
          onInputPointsChange={(value) =>
            setInputPoints(parseInt(value) || 1000)
          }
          pointScale={pointScale}
          onPointScaleChange={(value) => setPointScale(parseInt(value) || 1)}
          time={time}
          onTimeChange={(value) => setTime(parseInt(value) || 30)}
          statistics={statistics}
          onStatisticsChange={setStatistics}
          isPending={addPreset.isPending}
          error={addPreset.error}
          isDivisible={isDivisible}
        />
      </PageContainer>
    </PageLayout>
  );
}
