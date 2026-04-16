import { useState } from "preact/hooks";
import { usePreset } from "@hooks/preset";
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
import { Bar } from "@components/atoms/bar";

interface PresetPageProps {
  guildId: string;
  presetId: number;
}

export function PresetPage({ guildId, presetId }: PresetPageProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createdAuctionId, setCreatedAuctionId] = useState<string | null>(null);

  const { data: preset, error: presetError } = usePreset(guildId, presetId);
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
                  onClick={() => setShowUpdate(true)}
                />
              )}
              {canEdit && (
                <DeleteButton
                  variantSize="medium"
                  onClick={() => setShowDelete(true)}
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
            onClick={() => setShowCreate(true)}
          >
            경매 생성
          </Button>
        )}
      </PrimarySection>

      <PresetMemberEditor guildId={guildId} presetId={presetId} />

      {preset && showUpdate && (
        <UpdatePresetModal
          guildId={guildId}
          presetId={presetId}
          preset={preset}
          onClose={() => setShowUpdate(false)}
        />
      )}

      {showDelete && (
        <DeletePresetModal
          guildId={guildId}
          presetId={presetId}
          onClose={() => setShowDelete(false)}
        />
      )}

      {showCreate && (
        <CreateAuctionModal
          guildId={guildId}
          presetId={presetId}
          onClose={() => setShowCreate(false)}
          onSuccess={(auctionId) => {
            setShowCreate(false);
            setCreatedAuctionId(auctionId);
          }}
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
