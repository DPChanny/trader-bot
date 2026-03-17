import { PresetUserGrid } from "@/components/presetUserGrid";
import type { PresetUserDetail, Team } from "@/dto";
import { Section } from "@/components/section";
import { Bar } from "@/components/bar";
import { cva } from "class-variance-authority";
import styles from "@/styles/pages/auction/teamCard.module.css";

const teamCardVariants = cva(styles.teamCard, {
  variants: {
    variantColor: {
      default: "",
      full: styles.colorFull,
    },
  },
  defaultVariants: {
    variantColor: "default",
  },
});

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
  const teamName = leader ? `${leader.user.name} 팀` : `Team ${team.teamId}`;
  const isFull = members.length === 5;

  return (
    <Section
      variantIntent="secondary"
      className={teamCardVariants({
        variantColor: isFull ? "full" : "default",
      })}
    >
      <Section variantTone="ghost" variantLayout="row">
        <h4>{teamName}</h4>
        <span className={styles.points}>{team.points * pointScale} 포인트</span>
      </Section>
      <Bar />
      <PresetUserGrid
        className={styles.membersGrid}
        presetUsers={members}
        onUserClick={() => {}}
        connectedUsers={connectedUsers}
        clientUserId={clientUserId}
      />
    </Section>
  );
}
