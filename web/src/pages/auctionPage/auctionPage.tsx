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
import { isAuthenticated } from "@/utils/auth";
import type { PresetMemberDetailDTO } from "@/dtos/presetMemberDto";
import { AuctionStatus } from "@/dtos/auctionDto";

import styles from "@/styles/pages/auctionPage/auctionPage.module.css";

interface AuctionPageProps {
  path?: string;
  auctionId?: string;
}

export function AuctionPage({ auctionId }: AuctionPageProps) {
  const [bidAmount, setBidAmount] = useState<string>("");
  const reconnectedRef = useRef(false);

  const {
    isConnected,
    wasConnected,
    connect,
    placeBid,
    state,
    isLeader,
    teamId,
    connectedUsers,
    memberId,
    closeReason,
  } = useAuctionWebSocket();

  useEffect(() => {
    if (auctionId !== undefined) {
      connect(auctionId);
    }
  }, []);

  useEffect(() => {
    if (
      state !== null &&
      memberId === null &&
      isConnected &&
      !reconnectedRef.current &&
      isAuthenticated() &&
      auctionId !== undefined
    ) {
      reconnectedRef.current = true;
      connect(auctionId);
    }
  }, [state, memberId, isConnected]);

  const isCompleted = state?.status === AuctionStatus.COMPLETED;

  const errorMessage = closeReason
    ? closeReason
    : !isCompleted && wasConnected && !isConnected
      ? "서버와의 연결이 끊어졌습니다."
      : null;

  if (errorMessage) {
    return (
      <PageLayout>
        <Section variantIntent="primary" className={styles.centerSection}>
          <Error>{errorMessage}</Error>
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
    pointScale: number;
  } | null;

  const presetMembers: PresetMemberDetailDTO[] = snapshot?.presetMembers ?? [];
  const pointScale: number = snapshot?.pointScale ?? 1;

  const presetMemberMap = new Map<number, PresetMemberDetailDTO>(
    presetMembers.map((pm) => [pm.memberId, pm]),
  );

  const auctionQueueMembers = state!.auctionQueue
    .map((memberId) => presetMemberMap.get(memberId))
    .filter((m): m is PresetMemberDetailDTO => m !== undefined);

  const unsoldQueueMembers = state!.unsoldQueue
    .map((memberId) => presetMemberMap.get(memberId))
    .filter((m): m is PresetMemberDetailDTO => m !== undefined);

  const currentTeam = teamId
    ? state.teams.find((t) => t.teamId === teamId)
    : null;
  const teamMemberCount = currentTeam ? currentTeam.memberIdList.length : 0;
  const isTeamFull = teamMemberCount >= 5;

  const getStatusText = (status: AuctionStatus) => {
    if (wasConnected && !isConnected && status !== AuctionStatus.COMPLETED)
      return "연결 끊김";
    if (status === AuctionStatus.WAITING) return "대기중";
    if (status === AuctionStatus.IN_PROGRESS) return "진행중";
    if (status === AuctionStatus.COMPLETED) return "완료";
    return String(status);
  };

  const currentMember = state.currentMemberId
    ? presetMemberMap.get(state.currentMemberId)
    : null;

  const bidderTeam = state.currentBidder
    ? state.teams.find((t) => t.teamId === state.currentBidder)
    : null;
  const leaderMemberId = bidderTeam?.leaderId;
  const bidderLeader = leaderMemberId
    ? presetMemberMap.get(leaderMemberId)
    : null;

  const handlePlaceBid = () => {
    const displayAmount = parseInt(bidAmount);
    if (displayAmount > 0 && displayAmount % pointScale === 0) {
      const actualAmount = displayAmount / pointScale;
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
          pointScale={pointScale}
          clientMemberId={memberId ?? undefined}
          connectedUsers={connectedUsers}
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
            {state.status !== AuctionStatus.COMPLETED && currentMember && (
              <PresetMemberCard presetMember={currentMember} />
            )}
          </Section>

          <Section
            variantTone="ghost"
            className={styles.auctionInfoGridSection}
          >
            <Section variantTone="ghost">
              <InfoCard
                label="남은 시간"
                value={
                  state.status === AuctionStatus.COMPLETED ? 0 : state.timer
                }
              />
              <InfoCard
                label="입찰 포인트"
                value={
                  state.status === AuctionStatus.COMPLETED
                    ? 0
                    : (state.currentBid || 0) * pointScale
                }
              />
            </Section>
            <InfoCard label="입찰 팀장" value="">
              {state.status !== AuctionStatus.COMPLETED && bidderLeader && (
                <PresetMemberCard presetMember={bidderLeader} />
              )}
            </InfoCard>
          </Section>

          {isLeader && !isTeamFull && (
            <Section
              variantTone="ghost"
              variantLayout="row"
              className={styles.auctionInfoBottomSection}
            >
              <Input
                type="number"
                placeholder={`입찰 금액 (${pointScale}의 배수)`}
                value={bidAmount}
                onChange={(value) => setBidAmount(value)}
                disabled={state.status !== AuctionStatus.IN_PROGRESS}
              />
              <PrimaryButton
                onClick={handlePlaceBid}
                disabled={
                  state.status !== AuctionStatus.IN_PROGRESS ||
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
              presetMembers={auctionQueueMembers}
              onMemberClick={() => {}}
              clientMemberId={memberId ?? undefined}
              connectedUsers={connectedUsers}
            />
          </Section>
        </Section>

        <Section variantIntent="primary" className={styles.queueSection}>
          <h3>유찰 목록</h3>
          <Bar />
          <Section variantTone="ghost" className={styles.queueGrid}>
            <PresetMemberGrid
              presetMembers={unsoldQueueMembers}
              onMemberClick={() => {}}
              connectedUsers={connectedUsers}
              clientMemberId={memberId ?? undefined}
            />
          </Section>
        </Section>
      </Section>
    </PageLayout>
  );
}
