import { PresetMemberGrid } from "@/components/presetMemberGrid";
import type { PresetMemberDetailDTO } from "@/dtos/presetMemberDto";
import type { Team } from "@/dtos/auctionDto";
import type { TierDTO } from "@/dtos/tierDto";
import type { PositionDTO } from "@/dtos/positionDto";
import { Card } from "@/components/commons/card";
import { Section } from "@/components/commons/section";
import { Bar } from "@/components/commons/bar";
import styles from "@/styles/pages/auction/teamCard.module.css";

interface TeamCardProps {
  team: Team;
  members: PresetMemberDetailDTO[];
  tiers: TierDTO[];
  positions: PositionDTO[];
  pointScale: number;
  connectedUsers?: number[];
  clientMemberId?: number;
}

export function TeamCard({
  team,
  members,
  tiers,
  positions,
  pointScale,
  connectedUsers,
  clientMemberId,
}: TeamCardProps) {
  const leader = members.find((member) => member.isLeader);
  const teamName = leader
    ? `${leader.member?.alias ?? leader.member?.name ?? "이름 없음"} 팀`
    : `Team ${team.teamId}`;
  const isFull = members.length === 5;
  const variantColor = isFull ? "green" : "blue";

  return (
    <Card variantColor={variantColor} variantLayout="column">
      <Section variantTone="ghost" variantLayout="row">
        <h4>{teamName}</h4>
        <span className={styles.points}>{team.points * pointScale} 포인트</span>
      </Section>
      <Bar variantColor={variantColor} />
      <PresetMemberGrid
        className={styles.membersGrid}
        presetMembers={members}
        tiers={tiers}
        positions={positions}
        onMemberClick={() => {}}
        connectedUsers={connectedUsers}
        clientMemberId={clientMemberId}
      />
    </Card>
  );
}
