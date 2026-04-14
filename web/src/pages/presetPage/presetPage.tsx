import { useState } from "preact/hooks";
import { route } from "preact-router";
import { useCreateAuction } from "@/hooks/auction";
import { usePreset, useUpdatePreset, useDeletePreset } from "@/hooks/preset";
import { usePresetMembers } from "@/hooks/presetMember";
import { Role } from "@/dtos/member";
import { useVerifyRole } from "@/hooks/member";
import { TierEditor } from "./tierEditor/tierEditor";
import { PositionEditor } from "./positionEditor/positionEditor";
import { PresetMemberEditor } from "./presetMemberEditor/presetMemberEditor";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@/components/commons/section";
import { Row } from "@/components/commons/layout";
import { PageLayout } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import { EditButton, DeleteButton, Button } from "@/components/commons/button";
import { Error } from "@/components/commons/error";
import { UpdatePresetModal } from "./updatePresetModal";
import { DeletePresetModal } from "./deletePresetModal";
import { CreateAuctionModal } from "./createAuctionModal";
import { AuctionModal } from "./auctionModal";
import type { CreateAuctionDTO } from "@/dtos/auction";
import type { UpdatePresetDTO } from "@/dtos/preset";
import { Bar } from "@/components/commons/bar";

interface PresetPageProps {
  guildId: string;
  presetId: number;
}

export function PresetPage({ guildId, presetId }: PresetPageProps) {
  const [showUpdatePresetModal, setShowUpdatePresetModal] = useState(false);
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
  const presetMemberCount = presetMembers?.length ?? 0;
  const requiredPresetMembers = leaderCount * teamSize;
  const canStartAuction = !!presetMembers && leaderCount >= 2;

  let presetValidMessage = "";
  if (presetMembers) {
    if (leaderCount < 2) {
      presetValidMessage = `현재 팀장 인원(${leaderCount}명)이 최소 인원(2명)보다 적습니다.`;
    } else if (presetMemberCount < requiredPresetMembers) {
      presetValidMessage = `현재 전체 인원(${presetMemberCount}명)이 권장 인원(${requiredPresetMembers}명)보다 적습니다.`;
    }
  }

  const auctionButtonIntent = !canStartAuction
    ? "danger"
    : presetValidMessage
      ? "warning"
      : "primary";

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

  const handleUpdate = async (dto: UpdatePresetDTO) => {
    if (!preset) return;
    try {
      await updatePreset.mutateAsync({
        guildId,
        presetId: preset.presetId,
        dto,
      });
      setShowUpdatePresetModal(false);
    } catch {}
  };

  const handleOpenUpdatePresetModal = () => {
    setShowUpdatePresetModal(true);
  };

  const handleCloseUpdatePresetModal = () => {
    setShowUpdatePresetModal(false);
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
      <PrimarySection
        minSize
        overflow="hidden"
        style={{ width: "24rem", flex: "none" }}
      >
        {isPresetLoading ? (
          <SecondarySection>
            <Loading />
          </SecondarySection>
        ) : presetError ? (
          <SecondarySection>
            <Error error={presetError}>프리셋을 불러오는데 실패했습니다.</Error>
          </SecondarySection>
        ) : !preset ? (
          <SecondarySection>
            <Error>프리셋을 찾을 수 없습니다.</Error>
          </SecondarySection>
        ) : (
          <SecondarySection>
            <Row>
              <h3>{preset.name}</h3>
              <Row>
                {canEdit && (
                  <EditButton
                    variantSize="medium"
                    onClick={handleOpenUpdatePresetModal}
                  />
                )}
                {canEdit && (
                  <DeleteButton
                    variantSize="medium"
                    onClick={handleOpenDeletePresetModal}
                  />
                )}
              </Row>
            </Row>
            <Bar />
            <TertiarySection>
              <Row>
                <span>{teamSize} 명</span>
                <span>
                  {preset.points * preset.pointScale} / {preset.pointScale}{" "}
                  포인트
                </span>
                <span>{preset.timer} 초</span>
              </Row>
            </TertiarySection>

            {canEdit && (
              <Button
                variantIntent={auctionButtonIntent}
                onClick={() => setShowCreateAuctionModal(true)}
              >
                경매 생성
              </Button>
            )}
          </SecondarySection>
        )}

        <TierEditor guildId={guildId} presetId={presetId} />
        <PositionEditor guildId={guildId} presetId={presetId} />
      </PrimarySection>

      <PresetMemberEditor guildId={guildId} presetId={presetId} />

      {preset && showUpdatePresetModal && (
        <UpdatePresetModal
          preset={preset}
          onClose={handleCloseUpdatePresetModal}
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
          message={presetValidMessage || undefined}
          isHardError={!canStartAuction}
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
