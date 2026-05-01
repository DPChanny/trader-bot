import type { PresetMemberDetailDTO } from "@features/presetMember/dto";
import type { TeamDTO } from "@features/auction/dto";
import { PresetMemberCard } from "@components/presetMemberCard";
import { Card } from "@components/surfaces/card";
import { Row, Scroll } from "@components/atoms/layout";
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
      <Scroll axis="x">
        <Row>
          {members.map((member) => (
            <PresetMemberCard
              key={member.presetMemberId}
              presetMember={member}
            />
          ))}
        </Row>
      </Scroll>
    </Card>
  );
}
