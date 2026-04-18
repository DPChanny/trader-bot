import { PresetMemberGrid } from "@components/presetMemberGrid";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import type { TeamDTO } from "@dtos/auction";
import { Card } from "@components/surfaces/card";
import { Row } from "@components/atoms/layout";
import { Name, Text } from "@components/atoms/text";

type TeamCardProps = {
  team: TeamDTO;
  members: PresetMemberDetailDTO[];
  teamSize: number;
  pointScale: number;
  variantColor?: "blue" | "gold" | "green" | "gray";
};

export function TeamCard({
  team,
  members,
  teamSize,
  pointScale,
  variantColor,
}: TeamCardProps) {
  const leader = members.find((member) => member.isLeader);
  const teamName = leader
    ? `${leader.member.alias ?? leader.member.name ?? leader.member.user.name} 팀`
    : `Team ${team.teamId}`;
  const isFull = members.length >= teamSize;
  const resolvedVariantColor = variantColor ?? (isFull ? "green" : "blue");

  return (
    <Card variantColor={resolvedVariantColor}>
      <Row justify="between" align="center">
        <Name>{teamName}</Name>
        <Text variantWeight="bold">{team.points * pointScale} 포인트</Text>
      </Row>
      <PresetMemberGrid presetMembers={members} />
    </Card>
  );
}
