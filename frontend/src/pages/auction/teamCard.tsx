import { PresetUserGrid } from "@/components/presetUserGrid";
import type { PresetUserDetail, Team } from "@/dto";
import { Card } from "@/components/card";
import { Section } from "@/components/section";
import { Bar } from "@/components/bar";
import styles from "@/styles/pages/auction/teamCard.module.css";

interface TeamCardProps {
  team: Team;
  members: PresetUserDetail[];
  pointScale: number;
  connectedUsers?: number[];
  clientUserId?: number;
}

export function TeamCard({
  team,
  members,
  pointScale,
  connectedUsers,
  clientUserId,
}: TeamCardProps) {
  const leader = members.find((member) => member.isLeader);
  const teamName = leader
    ? `${leader.user.alias ?? "이름 없음"} 팀`
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
      <PresetUserGrid
        className={styles.membersGrid}
        presetUsers={members}
        onUserClick={() => {}}
        connectedUsers={connectedUsers}
        clientUserId={clientUserId}
      />
    </Card>
  );
}
