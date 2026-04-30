import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuction } from "@features/auction/hook";

import { TeamList } from "./teamList";
import { InfoCard } from "./infoCard";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Column, FlexItem, Row } from "@components/atoms/layout";
import { Page } from "@components/atoms/layout";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { PrimaryButton } from "@components/atoms/button";
import { PresetMemberGrid } from "@components/presetMemberGrid";
import { PresetMemberCard } from "@components/presetMemberCard";
import { Input } from "@components/atoms/input";
import { Text, Title } from "@components/atoms/text";
import { ErrorModal } from "./errorModal";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";
import { Status } from "@features/auction/dto";
import {
  BackendErrorCode,
  FrontendErrorCode,
  type WSError,
} from "@utils/error";

function isBidErrorCode(code: number): boolean {
  switch (code) {
    case BackendErrorCode.Auction.BidTeamFull:
    case BackendErrorCode.Auction.BidTooLow:
    case BackendErrorCode.Auction.BidTooHigh:
    case BackendErrorCode.Auction.BidDuplicate:
    case BackendErrorCode.Auction.BidNotLeader:
      return true;
    default:
      return false;
  }
}

function isModalErrorCode(code: number): boolean {
  return (
    code === BackendErrorCode.Validation.Invalid ||
    code === BackendErrorCode.Unexpected.Internal ||
    code === BackendErrorCode.Unexpected.External ||
    code === FrontendErrorCode.Validation.Invalid ||
    code === FrontendErrorCode.Unexpected.Internal ||
    code === FrontendErrorCode.Unexpected.External
  );
}

export function AuctionPage() {
  const { auctionId } = useParams({ strict: false }) as { auctionId: string };
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const { presetId: presetIdStr } = useParams({ strict: false }) as {
    presetId: string;
  };
  const presetId = parseInt(presetIdStr, 10);

  const [bidAmount, setBidAmount] = useState<string>("");
  const [modalError, setModalError] = useState<WSError | null>(null);

  const {
    auction,
    timer,
    ttl,
    memberId,
    connect,
    placeBid,
    isConnected,
    wasConnected,
    error: rawError,
  } = useAuction();

  useEffect(() => {
    connect(guildId, presetId, auctionId);
  }, [auctionId]);

  const isCompleted = auction?.status === Status.COMPLETED;
  const isRunning = auction?.status === Status.RUNNING;
  const isWaiting = auction?.status === Status.WAITING;
  const isPending = auction?.status === Status.PENDING;
  const isDisconnected = wasConnected && !isConnected && rawError !== null;

  const bidError =
    !isCompleted && rawError !== null && isBidErrorCode(rawError.code)
      ? rawError
      : null;

  useEffect(() => {
    if (
      isCompleted ||
      auction === null ||
      rawError === null ||
      bidError !== null
    ) {
      setModalError(null);
      return;
    }

    if (isModalErrorCode(rawError.code)) {
      setModalError(rawError);
      return;
    }

    setModalError(null);
  }, [rawError, isCompleted, auction, bidError]);

  if (
    !isCompleted &&
    rawError !== null &&
    (auction === null ||
      isDisconnected ||
      (bidError === null && modalError === null))
  ) {
    return (
      <Page>
        <PrimarySection fill align="stretch" justify="center">
          <Error error={rawError}>
            {isDisconnected
              ? "연결이 끊겼습니다"
              : "경매 정보를 불러오지 못했습니다"}
          </Error>
        </PrimarySection>
      </Page>
    );
  }

  const isLoading = !auction || (!isConnected && !wasConnected);

  if (isLoading) {
    return (
      <Page>
        <Loading />
      </Page>
    );
  }

  const presetSnapshot = auction.presetSnapshot;

  const presetMembers: PresetMemberDetailDTO[] =
    presetSnapshot?.presetMembers ?? [];
  const teamSize: number = presetSnapshot?.teamSize ?? 0;
  const pointScale: number = presetSnapshot?.pointScale ?? 1;

  const presetMemberMap = new Map<number, PresetMemberDetailDTO>(
    presetMembers.map((pm) => [pm.memberId, pm]),
  );

  const auctionQueuePresetMembers = auction.auctionQueue
    .map((memberId) => presetMemberMap.get(memberId))
    .filter((m): m is PresetMemberDetailDTO => m !== undefined);

  const unsoldQueuePresetMembers = auction.unsoldQueue
    .map((memberId) => presetMemberMap.get(memberId))
    .filter((m): m is PresetMemberDetailDTO => m !== undefined);

  const clientTeam =
    memberId !== null
      ? (auction.teams.find((t) => t.leaderId === memberId) ?? null)
      : null;
  const isLeader = clientTeam !== null;
  const clientTeamSize = clientTeam ? clientTeam.memberIds.length : 0;
  const isClientTeamFull = clientTeamSize >= teamSize;
  const canBid =
    isRunning && isLeader && !isClientTeamFull && auction.playerId !== null;

  const currentMember = auction.playerId
    ? (presetMemberMap.get(auction.playerId) ?? null)
    : null;

  const currentBidLeaderId = auction.bid?.leaderId;
  const currentBidLeader =
    currentBidLeaderId !== null && currentBidLeaderId !== undefined
      ? presetMemberMap.get(currentBidLeaderId)
      : null;

  const handlePlaceBid = () => {
    const displayAmount = Number(bidAmount);
    if (displayAmount > 0 && displayAmount % pointScale === 0) {
      const actualAmount = displayAmount / pointScale;
      placeBid(actualAmount);
      setBidAmount("");
    }
  };

  const parsedBidAmount = Number(bidAmount);
  const isValidBidAmount =
    parsedBidAmount > 0 && parsedBidAmount % pointScale === 0;

  return (
    <Page>
      {modalError && (
        <ErrorModal error={modalError} onClose={() => setModalError(null)} />
      )}

      <PrimarySection minSize overflow="hidden" style={{ flex: 3 }}>
        <SecondarySection fill minSize>
          <Title>팀 목록</Title>
          <TeamList
            teams={auction.teams}
            presetMemberMap={presetMemberMap}
            teamSize={teamSize}
            pointScale={pointScale}
          />
        </SecondarySection>
      </PrimarySection>

      <PrimarySection minSize style={{ flex: 2 }}>
        <SecondarySection fill minSize>
          <Row align="center" justify="center">
            <Title>{presetSnapshot?.name} </Title>
            <Text>
              {String(Math.floor(ttl / 60)).padStart(2, "0")}:
              {String(ttl % 60).padStart(2, "0")}
            </Text>
          </Row>
          <Column fill>
            <TertiarySection fill>
              <Column fill center>
                {isWaiting ? (
                  <Text>
                    팀장 {auction.teams.length - auction.connectedLeaderCount}명
                    접속 대기 중
                  </Text>
                ) : isPending ? (
                  <Text>경매가 곧 시작됩니다</Text>
                ) : isCompleted ? (
                  <Text>경매가 완료되었습니다</Text>
                ) : currentMember !== null ? (
                  <PresetMemberCard presetMember={currentMember} />
                ) : null}
              </Column>
            </TertiarySection>

            <TertiarySection>
              <Row wrap>
                <FlexItem>
                  <Column>
                    <InfoCard label="남은 시간">
                      <Text variantWeight="bold" variantSize="large">
                        {timer}
                      </Text>
                    </InfoCard>
                    <InfoCard label="입찰 포인트">
                      <Text variantWeight="bold" variantSize="large">
                        {(auction.bid?.amount || 0) * pointScale}
                      </Text>
                    </InfoCard>
                  </Column>
                </FlexItem>
                <FlexItem>
                  <InfoCard label="입찰 팀장">
                    {currentBidLeader && (
                      <PresetMemberCard presetMember={currentBidLeader} />
                    )}
                  </InfoCard>
                </FlexItem>
              </Row>
            </TertiarySection>
            {isLeader && (
              <TertiarySection>
                {bidError && (
                  <Error error={bidError}>입찰 처리에 실패했습니다</Error>
                )}
                <Row>
                  <FlexItem>
                    <Input
                      type="number"
                      placeholder={`입찰 금액 (${pointScale}의 배수)`}
                      value={bidAmount}
                      min={pointScale}
                      step={pointScale}
                      onValueChange={setBidAmount}
                      disabled={!canBid}
                    />
                  </FlexItem>
                  <PrimaryButton
                    onClick={handlePlaceBid}
                    disabled={!canBid || !bidAmount || !isValidBidAmount}
                  >
                    입찰하기
                  </PrimaryButton>
                </Row>
              </TertiarySection>
            )}
          </Column>
        </SecondarySection>
      </PrimarySection>

      <PrimarySection minSize overflow="hidden" style={{ flex: 3 }}>
        <Column fill minSize>
          <SecondarySection fill minSize overflow="hidden">
            <Title>경매 순서</Title>
            <PresetMemberGrid presetMembers={auctionQueuePresetMembers} />
          </SecondarySection>

          <SecondarySection fill minSize overflow="hidden">
            <Title>유찰 목록</Title>
            <PresetMemberGrid presetMembers={unsoldQueuePresetMembers} />
          </SecondarySection>
        </Column>
      </PrimarySection>
    </Page>
  );
}
