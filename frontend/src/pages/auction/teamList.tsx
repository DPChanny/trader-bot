import { TeamCard } from "./teamCard";
import type { PresetMemberDetailDTO } from "@/dtos/presetMemberDto";
import type { Team } from "@/dtos/auctionDto";
import { Section } from "@/components/commons/section";
import styles from "@/styles/pages/auction/teamList.module.css";

interface TeamListProps {
  teams: Team[];
  presetMembers: PresetMemberDetailDTO[];
  pointScale: number;
  connectedUsers?: number[];
  clientMemberId?: number;
}

export function TeamList({
  teams,
  presetMembers,
  pointScale,
  connectedUsers,
  clientMemberId,
}: TeamListProps) {
  return (
    <Section
      variantTone="ghost"
      className={styles.teamList}
      variantLayout="column"
    >
      {teams.map((team) => {
        const members = presetMembers.filter((pm) =>
          team.memberIdList.includes(pm.memberId),
        );

        return (
          <TeamCard
            key={team.teamId}
            team={team}
            members={members}
            pointScale={pointScale}
            connectedUsers={connectedUsers}
            clientMemberId={clientMemberId}
          />
        );
      })}
    </Section>
  );
}
