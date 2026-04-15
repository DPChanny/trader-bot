import { TeamCard } from "./teamCard";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import type { TeamDTO } from "@dtos/auction";
import { Scroll } from "@components/atoms/layout";
import { SecondarySection } from "@components/molecules/section";

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
    <SecondarySection fill>
      <Scroll axis="y" fill gap="md">
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
      </Scroll>{" "}
    </SecondarySection>
  );
}
