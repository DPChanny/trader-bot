import { TeamCard } from "./teamCard";
import type { PresetUserDetail, Team } from "@/dtos";
import { Section } from "@/components/section";
import styles from "@/styles/pages/auction/teamList.module.css";

interface TeamListProps {
  teams: Team[];
  presetUsers: PresetUserDetail[];
  pointScale: number;
  connectedUsers?: number[];
  clientUserId?: number | null;
}

export function TeamList({
  teams,
  presetUsers,
  pointScale,
  connectedUsers,
  clientUserId,
}: TeamListProps) {
  return (
    <Section
      variantTone="ghost"
      className={styles.teamList}
      variantLayout="column"
    >
      {teams.map((team) => {
        const members = presetUsers.filter((pu) =>
          team.memberIdList.includes(pu.userId),
        );

        return (
          <TeamCard
            key={team.teamId}
            team={team}
            members={members}
            pointScale={pointScale}
            connectedUsers={connectedUsers}
            clientUserId={clientUserId}
          />
        );
      })}
    </Section>
  );
}
