import { TeamCard } from "./teamCard";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";
import type { TeamDTO } from "@features/auction/dto";
import { Scroll } from "@components/atoms/layout";
import { TertiarySection } from "@components/surfaces/section";

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

