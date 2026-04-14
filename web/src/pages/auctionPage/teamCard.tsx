import { PresetMemberGrid } from "@/components/presetMemberGrid";
import type { PresetMemberDetailDTO } from "@/dtos/presetMember";
import type { TeamDTO } from "@/dtos/auction";
import { Card } from "@/components/commons/card";
import { Row } from "@/components/commons/layout";
import { Bar } from "@/components/commons/bar";
import styles from "@/styles/pages/auctionPage/teamCard.module.css";

interface TeamCardProps {
  team: TeamDTO;
  members: PresetMemberDetailDTO[];
  teamSize: number;
  pointScale: number;
  connectedMemberIds?: number[];
  clientMemberId?: number;
}

export function TeamCard({
  team,
  members,
  teamSize,
  pointScale,
  connectedMemberIds,
  clientMemberId,
}: TeamCardProps) {
  const leader = members.find((member) => member.isLeader);
  const teamName = leader
    ? `${leader.member.alias ?? leader.member.name ?? leader.member.user.name} 팀`
    : `Team ${team.teamId}`;
  const isFull = members.length >= teamSize;
  const variantColor = isFull ? "green" : "blue";

  return (
    <Card variantColor={variantColor} variantLayout="column">
      <Row
        gap="sm"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <h4>{teamName}</h4>
        <span className={styles.points}>{team.points * pointScale} 포인트</span>
      </Row>
      <Bar variantColor={variantColor} />
      <PresetMemberGrid
        className={styles.membersGrid}
        presetMembers={members}
        onMemberClick={() => {}}
        connectedMemberIds={connectedMemberIds}
        clientMemberId={clientMemberId}
      />
    </Card>
  );
}
