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
import { Loading } from "@/components/commons/loading";
import {
  PrimaryButton,
  EditButton,
  DeleteButton,
} from "@/components/commons/button";
import { Error } from "@/components/commons/error";
import { ConfirmModal } from "@/components/commons/modal";
import { EditPresetModal } from "./editPresetModal";
import styles from "@/styles/pages/guild/presetEditor/presetEditor.module.css";

interface PresetEditorProps {
  guildId: string;
  presetId: number;
}

export function PresetEditor({ guildId, presetId }: PresetEditorProps) {
  const [showEditPresetModal, setShowEditPresetModal] = useState(false);
  const [showDeletePresetModal, setShowDeletePresetModal] = useState(false);

  const addAuction = useAddAuction();
  const {
    data: preset,
    isLoading: isPresetLoading,
    error: presetError,
  } = usePreset(guildId, presetId);
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();
  const { data: presetMembers } = usePresetMembers(guildId, presetId);
  const teamSize = preset?.teamSize ?? 0;
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
      setShowEditPresetModal(false);
    } catch {}
  };

  const handleOpenEditPresetModal = () => {
    setShowEditPresetModal(true);
  };

  const handleCloseEditPresetModal = () => {
    setShowEditPresetModal(false);
    updatePreset.reset();
  };

  const handleOpenDeletePresetModal = () => {
    setShowDeletePresetModal(true);
  };

  const handleCloseDeletePresetModal = () => {
    setShowDeletePresetModal(false);
  };

  const handleDelete = async () => {
    try {
      await deletePreset.mutateAsync({ guildId, presetId });
      setShowDeletePresetModal(false);
      route(`/guild/${guildId}/member`);
    } catch {}
  };

  return (
    <>
      <PageLayout>
        <PageContainer>
          <Section variantIntent="primary" className={styles.panelSection}>
            {isPresetLoading ? (
              <Section variantIntent="secondary">
                <Loading />
              </Section>
            ) : presetError ? (
              <Section variantIntent="secondary">
                <Error detail={presetError.message}>
                  프리셋을 불러오는데 실패했습니다.
                </Error>
              </Section>
            ) : !preset ? (
              <Section variantIntent="secondary">
                <Error>프리셋을 찾을 수 없습니다.</Error>
              </Section>
            ) : (
              <Section variantIntent="secondary">
                <Section
                  variantTone="ghost"
                  variantLayout="row"
                  variantIntent="secondary"
                >
                  <h3>{preset.name}</h3>
                  <Section
                    variantTone="ghost"
                    variantLayout="row"
                    variantIntent="secondary"
                  >
                    <EditButton
                      variantSize="small"
                      onClick={handleOpenEditPresetModal}
                    />
                    <DeleteButton
                      variantSize="small"
                      onClick={handleOpenDeletePresetModal}
                    />
                  </Section>
                </Section>
                <Section variantLayout="row" variantIntent="tertiary">
                  <span>팀 크기: {teamSize}명</span>
                  <span>포인트: {preset.points * preset.pointScale}</span>
                  <span>타이머: {preset.timer}초</span>
                </Section>

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
            )}

            <Section variantIntent="secondary" className={styles.tierSection}>
              <TierEditor guildId={guildId} presetId={presetId} />
            </Section>
            <Section
              variantIntent="secondary"
              className={styles.positionSection}
            >
              <PositionEditor guildId={guildId} presetId={presetId} />
            </Section>
          </Section>

          <Section
            variantIntent="primary"
            className={styles.presetDetailSection}
          >
            <PresetMemberEditor guildId={guildId} presetId={presetId} />
          </Section>
        </PageContainer>
      </PageLayout>

      {preset && showEditPresetModal && (
        <EditPresetModal
          preset={preset}
          onClose={handleCloseEditPresetModal}
          onSubmit={handleUpdate}
          isPending={updatePreset.isPending}
          error={updatePreset.error}
        />
      )}

      {showDeletePresetModal && (
        <ConfirmModal
          onClose={handleCloseDeletePresetModal}
          onConfirm={handleDelete}
          title="프리셋 삭제"
          message="정말 이 프리셋을 삭제하시겠습니까?"
          confirmText="삭제"
          isPending={deletePreset.isPending}
          error={deletePreset.isError ? deletePreset.error : undefined}
        />
      )}
    </>
  );
}
