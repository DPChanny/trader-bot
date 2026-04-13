import { TeamCard } from "./teamCard";
import type { PresetMemberDetailDTO } from "@/dtos/presetMemberDto";
import type { TeamDTO } from "@/dtos/auctionDto";
import { Section } from "@/components/commons/section";
import styles from "@/styles/pages/auctionPage/teamList.module.css";

interface TeamListProps {
  teams: TeamDTO[];
  presetMemberMap: Map<number, PresetMemberDetailDTO>;
  teamSize: number;
  pointScale: number;
  connectedMemberIds?: number[];
  clientMemberId?: number;
}

export function TeamList({
  teams,
  presetMemberMap,
  teamSize,
  pointScale,
  connectedMemberIds,
  clientMemberId,
}: TeamListProps) {
  return (
    <Section
      variantTone="ghost"
      className={styles.teamList}
      variantLayout="column"
    >
      {teams.map((team) => {
        const members = team.memberIds
          .map((id) => presetMemberMap.get(id))
          .filter((m): m is PresetMemberDetailDTO => m !== undefined);

        return (
          <TeamCard
            key={team.teamId}
            team={team}
            members={members}
            teamSize={teamSize}
            pointScale={pointScale}
            connectedMemberIds={connectedMemberIds}
            clientMemberId={clientMemberId}
          />
        );
      })}
    </Section>
  );
}
