import { TeamCard } from "./teamCard";
import type { PresetMemberDetailDTO } from "@/dtos/presetMemberDto";
import type { Team } from "@/dtos/auctionDto";
import { Section } from "@/components/commons/section";
import styles from "@/styles/pages/auctionPage/teamList.module.css";

interface TeamListProps {
  teams: Team[];
  presetMemberMap: Map<number, PresetMemberDetailDTO>;
  pointScale: number;
  connectedUsers?: number[];
  clientMemberId?: number;
}

export function TeamList({
  teams,
  presetMemberMap,
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
        const members = team.memberIdList
          .map((id) => presetMemberMap.get(id))
          .filter((m): m is PresetMemberDetailDTO => m !== undefined);

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
