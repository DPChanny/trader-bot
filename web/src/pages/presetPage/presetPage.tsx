import { useState } from "preact/hooks";
import { route } from "preact-router";
import { useCreateAuction } from "@/hooks/auction";
import { usePreset, useUpdatePreset, useDeletePreset } from "@/hooks/preset";
import { usePresetMembers } from "@/hooks/presetMember";
import { Role } from "@/dtos/memberDto";
import { useVerifyRole } from "@/hooks/member";
import { TierEditor } from "./tierEditor/tierEditor";
import { PositionEditor } from "./positionEditor/positionEditor";
import { PresetMemberEditor } from "./presetMemberEditor/presetMemberEditor";
import { Section } from "@/components/commons/section";
import { PageLayout } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import {
  PrimaryButton,
  EditButton,
  DeleteButton,
} from "@/components/commons/button";
import { Error } from "@/components/commons/error";
import { EditPresetModal } from "./editPresetModal";
import { DeletePresetModal } from "./deletePresetModal";
import { CreateAuctionModal } from "./createAuctionModal";
import { AuctionModal } from "./auctionModal";
import type { CreateAuctionDTO } from "@/dtos/auctionDto";
import styles from "@/styles/pages/presetPage/presetPage.module.css";
import { Bar } from "@/components/commons/bar";

interface PresetPageProps {
  guildId: string;
  presetId: number;
}

export function PresetPage({ guildId, presetId }: PresetPageProps) {
  const [showEditPresetModal, setShowEditPresetModal] = useState(false);
  const [showDeletePresetModal, setShowDeletePresetModal] = useState(false);
  const [showCreateAuctionModal, setShowCreateAuctionModal] = useState(false);
  const [createdAuctionId, setCreatedAuctionId] = useState<string | null>(null);

  const createAuction = useCreateAuction();
  const {
    data: preset,
    isLoading: isPresetLoading,
    error: presetError,
  } = usePreset(guildId, presetId);
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();
  const { data: presetMembers } = usePresetMembers(guildId, presetId);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
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

  const handleStartAuction = async (dto: CreateAuctionDTO) => {
    try {
      const result = await createAuction.mutateAsync({
        guildId,
        presetId,
        dto,
      });
      setShowCreateAuctionModal(false);
      setCreatedAuctionId(result.auctionId);
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
    <PageLayout>
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
                {canEdit && (
                  <EditButton
                    variantSize="medium"
                    onClick={handleOpenEditPresetModal}
                  />
                )}
                {canEdit && (
                  <DeleteButton
                    variantSize="medium"
                    onClick={handleOpenDeletePresetModal}
                  />
                )}
              </Section>
            </Section>
            <Bar />
            <Section variantLayout="row" variantIntent="tertiary">
              <span>팀 크기: {teamSize}명</span>
              <span>포인트: {preset.points * preset.pointScale}</span>
              <span>타이머: {preset.timer}초</span>
            </Section>

            {presetValidMessage && <Error>{presetValidMessage}</Error>}
            {canEdit && (
              <PrimaryButton
                onClick={() => setShowCreateAuctionModal(true)}
                disabled={!canStartAuction}
              >
                경매 생성
              </PrimaryButton>
            )}
          </Section>
        )}

        <TierEditor guildId={guildId} presetId={presetId} />
        <PositionEditor guildId={guildId} presetId={presetId} />
      </Section>

      <PresetMemberEditor guildId={guildId} presetId={presetId} />

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
        <DeletePresetModal
          onClose={handleCloseDeletePresetModal}
          onConfirm={handleDelete}
          isPending={deletePreset.isPending}
          error={deletePreset.isError ? deletePreset.error : undefined}
        />
      )}

      {showCreateAuctionModal && (
        <CreateAuctionModal
          onClose={() => {
            setShowCreateAuctionModal(false);
            createAuction.reset();
          }}
          onSubmit={handleStartAuction}
          isPending={createAuction.isPending}
          error={createAuction.isError ? createAuction.error : undefined}
        />
      )}

      {createdAuctionId && (
        <AuctionModal
          auctionId={createdAuctionId}
          onClose={() => setCreatedAuctionId(null)}
        />
      )}
    </PageLayout>
  );
}
