import { useState } from "preact/hooks";
import { route } from "preact-router";
import { useCreateAuction } from "@hooks/auction";
import { usePreset, useUpdatePreset, useDeletePreset } from "@hooks/preset";
import { usePresetMembers } from "@hooks/presetMember";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { TierEditor } from "./tierEditor/tierEditor";
import { PositionEditor } from "./positionEditor/positionEditor";
import { PresetMemberEditor } from "./presetMemberEditor/presetMemberEditor";
import {
  PrimarySection,
  SecondarySection,
} from "@components/molecules/section";
import { Row } from "@components/atoms/layout";
import { Page } from "@components/atoms/layout";
import { EditButton, DeleteButton, Button } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { UpdatePresetModal } from "./updatePresetModal";
import { DeletePresetModal } from "./deletePresetModal";
import { CreateAuctionModal } from "./createAuctionModal";
import { AuctionCreatedModal } from "./auctionCreatedModal";
import { NameTitle, Text } from "@components/atoms/text";
import type { CreateAuctionDTO } from "@dtos/auction";
import type { UpdatePresetDTO } from "@dtos/preset";
import { Bar } from "@components/atoms/bar";

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
  const { data: preset, error: presetError } = usePreset(guildId, presetId);
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
    createAuction.mutate(
      {
        guildId,
        presetId,
        dto,
      },
      {
        onSuccess: (result) => {
          setShowCreateAuctionModal(false);
          setCreatedAuctionId(result.auctionId);
        },
      },
    );
  };

  const handleUpdate = async (dto: UpdatePresetDTO) => {
    if (!preset) return;
    updatePreset.mutate(
      {
        guildId,
        presetId: preset.presetId,
        dto,
      },
      {
        onSuccess: () => {
          setShowUpdatePresetModal(false);
        },
      },
    );
  };

  const handleDelete = async () => {
    deletePreset.mutate(
      { guildId, presetId },
      {
        onSuccess: () => {
          setShowDeletePresetModal(false);
          route(`/guild/${guildId}/member`);
        },
      },
    );
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
    deletePreset.reset();
  };

  return (
    <Page>
      <PrimarySection minSize overflow="hidden" style={{ width: "24rem" }}>
        {presetError ? (
          <Error error={presetError} />
        ) : (
          <Row justify="between" align="center">
            <NameTitle>{preset ? preset.name : "?"}</NameTitle>
            <Row gap="sm" align="center">
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
        )}

        <Bar />

        {presetError ? (
          <Error error={presetError} />
        ) : preset ? (
          <SecondarySection>
            <Row justify="between" align="center">
              <Text>{teamSize} 명</Text>
              <Text>
                {preset.points * preset.pointScale} / {preset.pointScale} 포인트
              </Text>
              <Text>{preset.timer} 초</Text>
            </Row>
          </SecondarySection>
        ) : (
          <SecondarySection>
            <Row justify="between" align="center">
              <Text>? 명</Text>
              <Text>? / ? 포인트</Text>
              <Text>? 초</Text>
            </Row>
          </SecondarySection>
        )}

        <TierEditor guildId={guildId} presetId={presetId} />
        <PositionEditor guildId={guildId} presetId={presetId} />

        {canEdit && (
          <Button
            variantIntent={auctionButtonIntent}
            onClick={() => setShowCreateAuctionModal(true)}
          >
            경매 생성
          </Button>
        )}
      </PrimarySection>

      <PresetMemberEditor guildId={guildId} presetId={presetId} />

      {preset && showUpdatePresetModal && (
        <UpdatePresetModal
          preset={preset}
          onClose={handleCloseUpdatePresetModal}
          onSubmit={handleUpdate}
          isPending={updatePreset.isPending}
          error={updatePreset.isError ? updatePreset.error : undefined}
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
          isHardError={!canStartAuction}
        />
      )}

      {createdAuctionId && (
        <AuctionCreatedModal
          auctionId={createdAuctionId}
          onClose={() => setCreatedAuctionId(null)}
        />
      )}
    </Page>
  );
}
