import { useState } from "react";
import { useAuthGuard } from "@features/auth/hook";
import { useGuildId, usePresetId } from "@hooks/route";
import { usePreset } from "@features/preset/hook";
import { usePresetMembers } from "@features/presetMember/hook";
import { Role } from "@features/member/dto";
import { useVerifyRole } from "@features/member/hook";
import { TierEditor } from "./tierEditor/tierEditor";
import { PositionEditor } from "./positionEditor/positionEditor";
import { PresetMemberEditor } from "./presetMemberEditor/presetMemberEditor";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";
import { Fill, Row } from "@components/atoms/layout";
import { Page } from "@components/atoms/layout";
import { EditButton, DeleteButton, Button } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { UpdatePresetModal } from "./updatePresetModal";
import { DeletePresetModal } from "./deletePresetModal";
import { CreateAuctionModal } from "./createAuctionModal";
import { AuctionCreatedModal } from "./auctionCreatedModal";
import { NameTitle, Text } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";

export function PresetPage() {
  useAuthGuard();
  const guildId = useGuildId();
  const presetId = usePresetId();

  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createdAuctionId, setCreatedAuctionId] = useState<string | null>(null);

  const preset = usePreset(guildId, presetId);
  const presetMembers = usePresetMembers(guildId, presetId);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
  const isAdmin = useVerifyRole(guildId, Role.ADMIN);
  const canCreateAuction = isAdmin;
  const teamSize = preset.data?.teamSize ?? 0;
  const leaderCount =
    presetMembers.data?.filter((pm) => pm.isLeader).length ?? 0;
  const presetMemberCount = presetMembers.data?.length ?? 0;
  const requiredPresetMembers = leaderCount * teamSize;
  const canStartAuction = !!presetMembers.data && leaderCount >= 2;

  let presetValidMessage = "";
  if (presetMembers.data) {
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
      <PrimarySection minSize overflow="hidden" style={{ width: "25rem" }}>
        {preset.error ? (
          <Error error={preset.error}>프리셋 정보를 불러오지 못했습니다</Error>
        ) : (
          <Row justify="between" align="center">
            <NameTitle>{preset.data ? preset.data.name : "로딩중"}</NameTitle>
            <Row gap="sm" align="center">
              {canEdit && (
                <EditButton
                  variantSize="medium"
                  onClick={() => setShowUpdate(true)}
                />
              )}
              {isAdmin && (
                <DeleteButton
                  variantSize="medium"
                  onClick={() => setShowDelete(true)}
                />
              )}
            </Row>
          </Row>
        )}

        <Bar />

        <SecondarySection>
          {preset.error ? (
            <Error error={preset.error}>
              프리셋 정보를 불러오지 못했습니다
            </Error>
          ) : preset.data ? (
            <Row justify="between" align="center">
              <Text>{teamSize} 명</Text>
              <Text>
                {preset.data.points * preset.data.pointScale} /{" "}
                {preset.data.pointScale} 포인트
              </Text>
              <Text>{preset.data.timer} 초</Text>
            </Row>
          ) : (
            <Fill center>
              <Text>로딩중</Text>
            </Fill>
          )}
        </SecondarySection>

        <TierEditor />
        <PositionEditor />

        {canCreateAuction && (
          <Button
            variantIntent={auctionButtonIntent}
            onClick={() => setShowCreate(true)}
          >
            경매 생성
          </Button>
        )}
      </PrimarySection>

      <PresetMemberEditor />

      {preset.data && showUpdate && (
        <UpdatePresetModal
          preset={preset.data}
          onClose={() => setShowUpdate(false)}
        />
      )}

      {showDelete && <DeletePresetModal onClose={() => setShowDelete(false)} />}

      {showCreate && (
        <CreateAuctionModal
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
          guildId={guildId}
          presetId={presetId}
          auctionId={createdAuctionId}
          onClose={() => setCreatedAuctionId(null)}
        />
      )}
    </Page>
  );
}
