import { TeamCard } from "./teamCard";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import type { TeamDTO } from "@dtos/auction";
import { Scroll } from "@components/atoms/layout";
import { TertiarySection } from "@components/molecules/section";

interface TeamListProps {
  teams: TeamDTO[];
  presetMemberMap: Map<number, PresetMemberDetailDTO>;
  teamSize: number;
  pointScale: number;
}

export function TeamList({
  teams,
  presetMemberMap,
  teamSize,
  pointScale,
}: TeamListProps) {
  return (
    <TertiarySection fill minSize>
      <Scroll axis="y" fill>
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
            />
          );
        })}
      </Scroll>
    </TertiarySection>
  );
}
