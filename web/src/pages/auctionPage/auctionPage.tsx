import { useEffect, useRef, useState } from "preact/hooks";
import { useAuctionWebSocket } from "@/hooks/auctionWebSocket";
import { TeamList } from "./teamList";
import { InfoCard } from "./infoCard";
import { Section } from "@/components/commons/section";
import { PageLayout } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { PrimaryButton } from "@/components/commons/button";
import { PresetMemberGrid } from "@/components/presetMemberGrid";
import { PresetMemberCard } from "@/components/presetMemberCard";
import { Input } from "@/components/commons/input";
import { Bar } from "@/components/commons/bar";
import { checkRefreshToken } from "@/utils/auth";
import type { PresetMemberDetailDTO } from "@/dtos/presetMember";
import { AuctionStatus } from "@/dtos/auction";
import {
  AuctionErrorCode,
  type AuctionErrorCodeType,
  type WSError,
} from "@/utils/error";

import styles from "@/styles/pages/auctionPage/auctionPage.module.css";

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

  const isCompleted = state?.status === AuctionStatus.COMPLETED;

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
      <PageLayout>
        <Section variantIntent="primary" className={styles.centerSection}>
          <Error error={websocketError}>{errorMessage}</Error>
        </Section>
      </PageLayout>
    );
  }

  const isLoading = !isCompleted && (!isConnected || !state);

  if (isLoading) {
    return (
      <PageLayout>
        <Loading />
      </PageLayout>
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

  const getStatusText = (status: AuctionStatus) => {
    if (wasConnected && !isConnected && status !== AuctionStatus.COMPLETED)
      return "연결 끊김";
    if (status === AuctionStatus.WAITING) return "대기중";
    if (status === AuctionStatus.RUNNING) return "진행중";
    if (status === AuctionStatus.COMPLETED) return "완료";
    return String(status);
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
    <PageLayout>
      <Section variantIntent="primary" className={styles.teamsSection}>
        <h3>팀 목록</h3>
        <Bar />
        <TeamList
          teams={state.teams}
          presetMemberMap={presetMemberMap}
          teamSize={teamSize}
          pointScale={pointScale}
          clientMemberId={memberId ?? undefined}
          connectedMemberIds={connectedMemberIds}
        />
      </Section>

      <Section variantIntent="primary" className={styles.auctionInfoSection}>
        <Section variantTone="ghost" variantLayout="row">
          <h3>경매 정보</h3>
          <span>{getStatusText(state.status)}</span>
        </Section>
        <Bar />
        <Section
          variantTone="ghost"
          className={styles.auctionInfoContentSection}
        >
          <Section
            variantIntent="secondary"
            className={styles.auctionInfoTopSection}
          >
            {currentMember && <PresetMemberCard presetMember={currentMember} />}
          </Section>

          <Section
            variantTone="ghost"
            className={styles.auctionInfoGridSection}
          >
            <Section variantTone="ghost">
              <InfoCard label="남은 시간" value={state.timer} />
              <InfoCard
                label="입찰 포인트"
                value={(state.currentBid?.amount || 0) * pointScale}
              />
            </Section>
            <InfoCard label="입찰 팀장" value="">
              {currentBidLeader && (
                <PresetMemberCard presetMember={currentBidLeader} />
              )}
            </InfoCard>
          </Section>

          {isLeader && !isClientTeamFull && (
            <Section
              variantTone="ghost"
              variantLayout="row"
              className={styles.auctionInfoBottomSection}
            >
              {bidError && <Error error={bidError}>{bidError.message}</Error>}
              <Input
                type="number"
                placeholder={`입찰 금액 (${pointScale}의 배수)`}
                value={bidAmount}
                onChange={(value) => {
                  setDismissedError(error);
                  setBidAmount(value);
                }}
                disabled={state.status !== AuctionStatus.RUNNING}
              />
              <PrimaryButton
                onClick={handlePlaceBid}
                disabled={
                  state.status !== AuctionStatus.RUNNING ||
                  !bidAmount ||
                  parseInt(bidAmount) <= 0 ||
                  parseInt(bidAmount) % pointScale !== 0
                }
              >
                입찰하기
              </PrimaryButton>
            </Section>
          )}
        </Section>
      </Section>

      <Section variantTone="ghost" className={styles.queueSection}>
        <Section variantIntent="primary" className={styles.queueSection}>
          <h3>경매 순서</h3>
          <Bar />
          <Section variantTone="ghost" className={styles.queueGrid}>
            <PresetMemberGrid
              presetMembers={auctionQueuePresetMembers}
              onMemberClick={() => {}}
              clientMemberId={memberId ?? undefined}
              connectedMemberIds={connectedMemberIds}
            />
          </Section>
        </Section>

        <Section variantIntent="primary" className={styles.queueSection}>
          <h3>유찰 목록</h3>
          <Bar />
          <Section variantTone="ghost" className={styles.queueGrid}>
            <PresetMemberGrid
              presetMembers={unsoldQueuePresetMembers}
              onMemberClick={() => {}}
              clientMemberId={memberId ?? undefined}
              connectedMemberIds={connectedMemberIds}
            />
          </Section>
        </Section>
      </Section>
    </PageLayout>
  );
}
