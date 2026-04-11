import { useState } from "preact/hooks";
import { route } from "preact-router";
import { useAddAuction } from "@/hooks/auction";
import { usePreset, useUpdatePreset, useDeletePreset } from "@/hooks/preset";
import { usePresetMembers } from "@/hooks/presetMember";
import { TierEditor } from "./tierEditor/tierEditor";
import { PositionEditor } from "./positionEditor/positionEditor";
import { PresetMemberEditor } from "./presetMemberEditor/presetMemberEditor";
import { Section } from "@/components/commons/section";
import { PageContainer, PageLayout } from "@/components/commons/page";
import {
  PrimaryButton,
  EditButton,
  DeleteButton,
} from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import { Error } from "@/components/commons/error";
import { ConfirmModal } from "@/components/commons/modal";
import { EditPresetModal } from "./editPresetModal";
import styles from "@/styles/pages/guild/presetEditor/presetEditor.module.css";

interface PresetEditorProps {
  guildId: string;
  presetId: number;
}

export function PresetEditor({ guildId, presetId }: PresetEditorProps) {
  const [isEditingPreset, setIsEditingPreset] = useState(false);
  const [isDeletingPreset, setIsDeletingPreset] = useState(false);

  const addAuction = useAddAuction();
  const { data: preset } = usePreset(guildId, presetId);
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();
  const { data: presetMembers } = usePresetMembers(guildId, presetId);

  const teamSize = preset?.teamSize ?? 5;
  const leaderCount = presetMembers?.filter((pm) => pm.isLeader).length ?? 0;
  const memberCount = presetMembers?.length ?? 0;
  const requiredMembers = leaderCount * teamSize;
  const canStartAuction = !!presetMembers && leaderCount >= 2;

  let presetValidMessage = "";
  if (presetMembers) {
    if (leaderCount < 2) {
      presetValidMessage = `현재 팀장 인원(${leaderCount}명)이 최소 인원(2명)보다 적습니다.`;
    } else if (memberCount < requiredMembers) {
      presetValidMessage = `현재 인원(${memberCount}명)이 권장 인원(${requiredMembers}명, 팀당 ${teamSize}명)보다 적습니다.`;
    }
  }

  const handleStartAuction = async () => {
    try {
      await addAuction.mutateAsync({ guildId, presetId });
    } catch {}
  };

  const handleUpdate = async (
    name: string,
    points: number,
    timer: number,
    teamSize: number,
    pointScale: number,
  ) => {
    if (!preset) return;
    try {
      await updatePreset.mutateAsync({
        guildId,
        presetId: preset.presetId,
        dto: { name, points, timer, teamSize, pointScale },
      });
      setIsEditingPreset(false);
    } catch {}
  };

  const handleDelete = async () => {
    try {
      await deletePreset.mutateAsync({ guildId, presetId });
      setIsDeletingPreset(false);
      route(`/guild/${guildId}/member`);
    } catch {}
  };

  return (
    <>
      <PageLayout>
        <PageContainer>
          <Section variantIntent="primary" className={styles.panelSection}>
            <Section variantTone="ghost" variantIntent="secondary">
              <Section
                variantTone="ghost"
                variantLayout="row"
                variantIntent="secondary"
              >
                <h3>{preset?.name ?? "프리셋 없음"}</h3>
                {preset && (
                  <Section
                    variantTone="ghost"
                    variantLayout="row"
                    variantIntent="secondary"
                  >
                    <EditButton
                      variantSize="small"
                      onClick={() => setIsEditingPreset(true)}
                    />
                    <DeleteButton
                      variantSize="small"
                      onClick={() => setIsDeletingPreset(true)}
                    />
                  </Section>
                )}
              </Section>
              {preset && (
                <Section
                  variantTone="ghost"
                  variantLayout="row"
                  variantIntent="tertiary"
                >
                  <span>팀 크기: {teamSize}명</span>
                  <span>포인트: {preset.points * preset.pointScale}</span>
                  <span>타이머: {preset.timer}초</span>
                </Section>
              )}
              <Bar />
              <PrimaryButton
                onClick={handleStartAuction}
                disabled={addAuction.isPending || !canStartAuction}
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
            <Bar />
            <>
              <Section variantIntent="secondary" className={styles.tierSection}>
                <TierEditor guildId={guildId} presetId={presetId} />
              </Section>
              <Section
                variantIntent="secondary"
                className={styles.positionSection}
              >
                <PositionEditor guildId={guildId} presetId={presetId} />
              </Section>
            </>
          </Section>

          <Section
            variantIntent="primary"
            className={styles.presetDetailSection}
          >
            <PresetMemberEditor guildId={guildId} presetId={presetId} />
          </Section>
        </PageContainer>
      </PageLayout>

      {preset && (
        <EditPresetModal
          preset={preset}
          isOpen={isEditingPreset}
          onClose={() => setIsEditingPreset(false)}
          onSubmit={handleUpdate}
          isPending={updatePreset.isPending}
          error={updatePreset.error}
        />
      )}
      <ConfirmModal
        isOpen={isDeletingPreset}
        onClose={() => setIsDeletingPreset(false)}
        onConfirm={handleDelete}
        title="프리셋 삭제"
        message="정말 이 프리셋을 삭제하시겠습니까?"
        confirmText="삭제"
        isPending={deletePreset.isPending}
        error={deletePreset.isError ? deletePreset.error : undefined}
      />
    </>
  );
}
