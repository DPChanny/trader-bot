import { useEffect, useState } from "preact/hooks";
import { useAuctionWebSocket } from "@hooks/auctionWebSocket";
import { TeamList } from "./teamList";
import { InfoCard } from "./infoCard";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { Column, FlexItem, Row } from "@components/atoms/layout";
import { Page } from "@components/atoms/layout";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { PrimaryButton } from "@components/atoms/button";
import { PresetMemberGrid } from "@components/presetMemberGrid";
import { PresetMemberCard } from "@components/presetMemberCard";
import { Input } from "@components/atoms/input";
import { Text, Title } from "@components/atoms/text";
import { UnexpectedErrorModal } from "./unexpectedErrorModal";
import { getStatusEntries } from "@utils/enum";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import { Status } from "@dtos/auction";
import {
  FrontendErrorCode,
  BackendErrorCode,
  type WSError,
} from "@utils/error";

interface AuctionPageProps {
  path?: string;
  auctionId?: string;
}

function isBidErrorCode(code: number): boolean {
  switch (code) {
    case BackendErrorCode.Auction.BidTeamFull:
    case BackendErrorCode.Auction.BidTooHigh:
    case BackendErrorCode.Auction.BidTooLow:
    case BackendErrorCode.Auction.BidNotLeader:
      return true;
    default:
      return false;
  }
}

function isUnexpectedErrorCode(code: number | null | undefined): boolean {
  return (
    code === BackendErrorCode.Unexpected.Internal ||
    code === BackendErrorCode.Unexpected.External ||
    code === FrontendErrorCode.Auction.InvalidMessage ||
    code === FrontendErrorCode.Unexpected.Internal ||
    code === FrontendErrorCode.Unexpected.External
  );
}

export function AuctionPage({ auctionId }: AuctionPageProps) {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [bidError, setBidError] = useState<WSError | null>(null);
  const [unexpectedError, setUnexpectedError] = useState<WSError | null>(null);

  const { state, connect, placeBid, isConnected, wasConnected, error } =
    useAuctionWebSocket();

  useEffect(() => {
    if (error === null) {
      setBidError(null);
      setUnexpectedError(null);
    }
  }, [error]);

  useEffect(() => {
    if (auctionId !== undefined) {
      connect(auctionId);
    }
  }, [auctionId]);

  const memberId = state?.memberId ?? null;
  const teamId = state?.teamId ?? null;
  const isLeader = teamId !== null;
  const connectedMemberIds = state?.connectedMemberIds ?? [];

  const isCompleted = state?.status === Status.COMPLETED;
  const isRunning = state?.status === Status.RUNNING;
  const isBidError =
    error !== null &&
    typeof error.code === "number" &&
    isBidErrorCode(error.code);

  useEffect(() => {
    if (isBidError && error !== null) {
      setBidError(error);
      return;
    }

    if (error !== null) {
      setBidError(null);
    }
  }, [error, isBidError]);

  useEffect(() => {
    if (
      !isCompleted &&
      error !== null &&
      !isBidError &&
      isUnexpectedErrorCode(error.code)
    ) {
      setUnexpectedError(error);
    }
  }, [error, isBidError, isCompleted]);

  const isUnexpectedError = !isBidError && isUnexpectedErrorCode(error?.code);

  const isBlockingError =
    !isCompleted &&
    error !== null &&
    !isBidError &&
    (state === null || !isUnexpectedError);

  if (isBlockingError && error !== null) {
    return (
      <Page>
        <PrimarySection fill align="stretch" justify="center">
          <Error error={error}>경매 정보를 불러오지 못했습니다</Error>
        </PrimarySection>
      </Page>
    );
  }

  const isLoading = !isCompleted && (!isConnected || !state);

  if (isLoading) {
    return (
      <Page>
        <Loading />
      </Page>
    );
  }

  if (!state)
    return (
      <Page>
        <Loading />
      </Page>
    );

  const snapshot = state.presetSnapshot as {
    presetMembers: PresetMemberDetailDTO[];
    teamSize: number;
    pointScale: number;
  } | null;

  const presetMembers: PresetMemberDetailDTO[] = snapshot?.presetMembers ?? [];
  const teamSize: number = snapshot?.teamSize ?? 5;
  const pointScale: number = snapshot?.pointScale ?? 1;

  const presetMemberMap = new Map<number, PresetMemberDetailDTO>(
    presetMembers.map((pm) => [pm.memberId, pm]),
  );

  const auctionQueuePresetMembers = state.auctionQueue
    .map((memberId) => presetMemberMap.get(memberId))
    .filter((m): m is PresetMemberDetailDTO => m !== undefined);

  const unsoldQueuePresetMembers = state.unsoldQueue
    .map((memberId) => presetMemberMap.get(memberId))
    .filter((m): m is PresetMemberDetailDTO => m !== undefined);

  const clientTeam =
    teamId !== null ? state.teams.find((t) => t.teamId === teamId) : null;
  const clientTeamSize = clientTeam ? clientTeam.memberIds.length : 0;
  const isClientTeamFull = clientTeamSize >= teamSize;
  const statusEntries = getStatusEntries();

  const getStatusText = (status: Status) => {
    if (wasConnected && !isConnected && !isCompleted) return "연결 끊김";
    return statusEntries[status].displayName;
  };

  const currentMember = state.currentMemberId
    ? presetMemberMap.get(state.currentMemberId)
    : null;

  const currentBidLeaderId = state.currentBid?.leaderId;
  const currentBidLeader =
    currentBidLeaderId !== null && currentBidLeaderId !== undefined
      ? presetMemberMap.get(currentBidLeaderId)
      : null;

  const handlePlaceBid = () => {
    const displayAmount = Number.parseInt(bidAmount, 10);
    if (displayAmount > 0 && displayAmount % pointScale === 0) {
      const actualAmount = displayAmount / pointScale;
      setBidError(null);
      placeBid(actualAmount);
      setBidAmount("");
    }
  };

  const parsedBidAmount = Number.parseInt(bidAmount, 10);
  const isValidBidAmount =
    parsedBidAmount > 0 && parsedBidAmount % pointScale === 0;

  return (
    <Page>
      {unexpectedError && (
        <UnexpectedErrorModal
          error={unexpectedError}
          onClose={() => setUnexpectedError(null)}
        />
      )}

      <PrimarySection minSize overflow="hidden" style={{ flex: 3 }}>
        <SecondarySection fill>
          <Title>팀 목록</Title>
          <TeamList
            teams={state.teams}
            presetMemberMap={presetMemberMap}
            teamSize={teamSize}
            pointScale={pointScale}
            clientMemberId={memberId ?? undefined}
            connectedMemberIds={connectedMemberIds}
          />
        </SecondarySection>
      </PrimarySection>

      <PrimarySection minSize style={{ flex: 2 }}>
        <SecondarySection fill>
          <Row justify="between">
            <Title>경매 정보</Title>
            <Text>{getStatusText(state.status)}</Text>
          </Row>
          <Column fill>
            <TertiarySection fill>
              <Column fill align="center">
                {currentMember && (
                  <PresetMemberCard presetMember={currentMember} />
                )}
              </Column>
            </TertiarySection>

            <TertiarySection>
              <Row wrap>
                <FlexItem>
                  <Column>
                    <InfoCard label="남은 시간">
                      <Text variantWeight="bold" variantSize="large">
                        {state.timer}
                      </Text>
                    </InfoCard>
                    <InfoCard label="입찰 포인트">
                      <Text variantWeight="bold" variantSize="large">
                        {(state.currentBid?.amount || 0) * pointScale}
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

            <TertiarySection>
              {isLeader && !isClientTeamFull && (
                <Row>
                  {bidError && (
                    <Error error={bidError}>입찰 처리에 실패했습니다</Error>
                  )}
                  <FlexItem>
                    <Input
                      type="number"
                      placeholder={`입찰 금액 (${pointScale}의 배수)`}
                      value={bidAmount}
                      onValueChange={(value) => {
                        setBidError(null);
                        setBidAmount(value);
                      }}
                      disabled={!isRunning}
                    />
                  </FlexItem>
                  <PrimaryButton
                    onClick={handlePlaceBid}
                    disabled={!isRunning || !bidAmount || !isValidBidAmount}
                  >
                    입찰하기
                  </PrimaryButton>
                </Row>
              )}
            </TertiarySection>
          </Column>
        </SecondarySection>
      </PrimarySection>

      <PrimarySection style={{ flex: 3 }}>
        <Column fill>
          <SecondarySection fill overflow="hidden">
            <Title>경매 순서</Title>
            <PresetMemberGrid
              presetMembers={auctionQueuePresetMembers}
              clientMemberId={memberId ?? undefined}
              connectedMemberIds={connectedMemberIds}
            />
          </SecondarySection>

          <SecondarySection fill overflow="hidden">
            <Title>유찰 목록</Title>
            <PresetMemberGrid
              presetMembers={unsoldQueuePresetMembers}
              clientMemberId={memberId ?? undefined}
              connectedMemberIds={connectedMemberIds}
            />
          </SecondarySection>
        </Column>
      </PrimarySection>
    </Page>
  );
}
