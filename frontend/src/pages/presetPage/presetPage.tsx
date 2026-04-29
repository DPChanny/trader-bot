import { useParams } from "@tanstack/react-router";
import { useState } from "react";
import { usePreset } from "@features/preset/hook";
import { useInfinitePresetMembers } from "@features/presetMember/hook";
import { Role } from "@features/member/dto";
import { useVerifyRole } from "@features/member/hook";
import { TierEditor } from "./tierEditor/tierEditor";
import { PositionEditor } from "./positionEditor/positionEditor";
import { PresetMemberEditor } from "./presetMemberEditor/presetMemberEditor";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";
import { Fill, Row } from "@components/atoms/layout";
import { Page } from "@components/atoms/layout";
import {
  EditButton,
  DeleteButton,
  Button,
  CopyButton,
} from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { UpdatePresetModal } from "./updatePresetModal";
import { DeletePresetModal } from "./deletePresetModal";
import { CopyPresetModal } from "./copyPresetModal";
import { AuctionCreatedModal } from "./auctionCreatedModal";
import { NameTitle, Text } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { useCreateAuction } from "@features/auction/hook";

export function PresetPage() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const { presetId: presetIdStr } = useParams({ strict: false }) as {
    presetId: string;
  };
  const presetId = parseInt(presetIdStr, 10);

  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [createdAuctionId, setCreatedAuctionId] = useState<string | null>(null);
  const createAuction = useCreateAuction();

  const preset = usePreset(guildId, presetId);
  const presetMembers = useInfinitePresetMembers(guildId, presetId);
  const allPresetMembers = presetMembers.data?.pages.flatMap((p) => p.items);
  const canView = useVerifyRole(guildId, Role.VIEWER);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
  const canAdmin = useVerifyRole(guildId, Role.ADMIN);
  const canCreateAuction = canAdmin;
  const teamSize = preset.data?.teamSize ?? 0;
  const leaderCount = allPresetMembers?.filter((pm) => pm.isLeader).length ?? 0;
  const presetMemberCount = allPresetMembers?.length ?? 0;
  const requiredPresetMembers = leaderCount * teamSize;
  const canStartAuction = !!allPresetMembers && leaderCount >= 2;

  let presetValidMessage = "";
  if (allPresetMembers) {
    if (leaderCount < 2) {
      presetValidMessage = `현재 팀장 인원(${leaderCount}명)이 최소 인원(2명)보다 적습니다.`;
    } else if (presetMemberCount !== requiredPresetMembers) {
      presetValidMessage = `현재 전체 인원(${presetMemberCount}명)이 권장 인원(${requiredPresetMembers}명)과 일치하지 않습니다.`;
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
              {canView && (
                <CopyButton
                  variantSize="medium"
                  onClick={() => setShowCopy(true)}
                />
              )}
              {canEdit && (
                <EditButton
                  variantSize="medium"
                  onClick={() => setShowUpdate(true)}
                />
              )}
              {canAdmin && (
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
            onClick={() =>
              createAuction.mutate(
                { guildId, presetId },
                {
                  onSuccess: (result) => setCreatedAuctionId(result.auctionId),
                },
              )
            }
            disabled={!canStartAuction || createAuction.isPending}
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

      {showCopy && <CopyPresetModal onClose={() => setShowCopy(false)} />}

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
