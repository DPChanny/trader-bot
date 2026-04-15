import { useEffect, useRef, useState } from "preact/hooks";
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
import { ErrorMessage } from "@components/molecules/errorMessage";
import { PrimaryButton } from "@components/atoms/button";
import { PresetMemberGrid } from "@components/presetMemberGrid";
import { PresetMemberCard } from "@components/presetMemberCard";
import { Input } from "@components/atoms/input";
import { Text, Title } from "@components/atoms/text";
import { checkRefreshToken } from "@utils/auth";
import { getStatusEntries } from "@utils/enum";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import { Status } from "@dtos/auction";
import {
  AuctionErrorCode,
  type AuctionErrorCodeType,
  type WSError,
} from "@utils/error";

interface AuctionPageProps {
  path?: string;
  auctionId?: string;
}

function isBidErrorCode(code: number): code is AuctionErrorCodeType {
  switch (code) {
    case AuctionErrorCode.BidTeamFull:
    case AuctionErrorCode.BidTooHigh:
    case AuctionErrorCode.BidTooLow:
    case AuctionErrorCode.BidNotLeader:
      return true;
    default:
      return false;
  }
}

export function AuctionPage({ auctionId }: AuctionPageProps) {
  const [bidAmount, setBidAmount] = useState<string>("");
  const [dismissedError, setDismissedError] = useState<WSError | null>(null);
  const reconnectedRef = useRef(false);

  const { state, connect, placeBid, isConnected, wasConnected, error } =
    useAuctionWebSocket();

  useEffect(() => {
    if (error === null) {
      setDismissedError(null);
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

  useEffect(() => {
    if (
      state !== null &&
      memberId === null &&
      isConnected &&
      !reconnectedRef.current &&
      checkRefreshToken() &&
      auctionId !== undefined
    ) {
      reconnectedRef.current = true;
      connect(auctionId);
    }
  }, [state, memberId, isConnected, auctionId]);

  const isCompleted = state?.status === Status.COMPLETED;

  const visibleError = error === dismissedError ? null : error;

  const bidError =
    visibleError !== null &&
    typeof visibleError.code === "number" &&
    isBidErrorCode(visibleError.code)
      ? visibleError
      : null;
  const websocketError = bidError ? null : visibleError;

  const errorMessage =
    !isCompleted && websocketError
      ? websocketError.message
      : !isCompleted && wasConnected && !isConnected
        ? "서버와의 연결이 끊어졌습니다."
        : null;

  if (errorMessage) {
    return (
      <Page>
        <PrimarySection fill align="stretch" justify="center">
          <ErrorMessage error={websocketError}>{errorMessage}</ErrorMessage>
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

  const snapshot = state!.presetSnapshot as {
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

  const auctionQueuePresetMembers = state!.auctionQueue
    .map((memberId) => presetMemberMap.get(memberId))
    .filter((m): m is PresetMemberDetailDTO => m !== undefined);

  const unsoldQueuePresetMembers = state!.unsoldQueue
    .map((memberId) => presetMemberMap.get(memberId))
    .filter((m): m is PresetMemberDetailDTO => m !== undefined);

  const clientTeam =
    teamId !== null ? state.teams.find((t) => t.teamId === teamId) : null;
  const clientTeamSize = clientTeam ? clientTeam.memberIds.length : 0;
  const isClientTeamFull = clientTeamSize >= teamSize;
  const statusEntries = getStatusEntries();

  const getStatusText = (status: Status) => {
    if (wasConnected && !isConnected && status !== Status.COMPLETED)
      return "연결 끊김";
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
    const displayAmount = parseInt(bidAmount);
    if (displayAmount > 0 && displayAmount % pointScale === 0) {
      const actualAmount = displayAmount / pointScale;
      setDismissedError(error);
      placeBid(actualAmount);
      setBidAmount("");
    }
  };

  return (
    <Page>
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
                    <InfoCard label="남은 시간" value={state.timer} />
                    <InfoCard
                      label="입찰 포인트"
                      value={(state.currentBid?.amount || 0) * pointScale}
                    />
                  </Column>
                </FlexItem>
                <FlexItem>
                  <InfoCard label="입찰 팀장" value="">
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
                  {bidError && <ErrorMessage error={bidError} />}
                  <FlexItem>
                    <Input
                      type="number"
                      placeholder={`입찰 금액 (${pointScale}의 배수)`}
                      value={bidAmount}
                      onValueChange={(value) => {
                        setDismissedError(error);
                        setBidAmount(value);
                      }}
                      disabled={state.status !== Status.RUNNING}
                    />
                  </FlexItem>
                  <PrimaryButton
                    onClick={handlePlaceBid}
                    disabled={
                      state.status !== Status.RUNNING ||
                      !bidAmount ||
                      parseInt(bidAmount) <= 0 ||
                      parseInt(bidAmount) % pointScale !== 0
                    }
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
              onMemberClick={() => {}}
              clientMemberId={memberId ?? undefined}
              connectedMemberIds={connectedMemberIds}
            />
          </SecondarySection>

          <SecondarySection fill overflow="hidden">
            <Title>유찰 목록</Title>
            <PresetMemberGrid
              presetMembers={unsoldQueuePresetMembers}
              onMemberClick={() => {}}
              clientMemberId={memberId ?? undefined}
              connectedMemberIds={connectedMemberIds}
            />
          </SecondarySection>
        </Column>
      </PrimarySection>
    </Page>
  );
}
