import { PresetMemberGrid } from "@components/presetMemberGrid";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import type { TeamDTO } from "@dtos/auction";
import { Card, type CardProps } from "@components/atoms/card";
import { Column, Row } from "@components/atoms/layout";
import { Bar } from "@components/atoms/bar";
import { Name, Text, Title } from "@components/atoms/text";

type TeamCardProps = Omit<CardProps, "children"> & {
  team: TeamDTO;
  members: PresetMemberDetailDTO[];
  teamSize: number;
  pointScale: number;
  connectedMemberIds?: number[];
  clientMemberId?: number;
};

export function TeamCard({
  team,
  members,
  teamSize,
  pointScale,
  connectedMemberIds,
  clientMemberId,
  variantColor,
  ...props
}: TeamCardProps) {
  const leader = members.find((member) => member.isLeader);
  const teamName = leader
    ? `${leader.member.alias ?? leader.member.name ?? leader.member.user.name} 팀`
    : `Team ${team.teamId}`;
  const isFull = members.length >= teamSize;
  const resolvedVariantColor = variantColor ?? (isFull ? "green" : "blue");
  const barVariantColor =
    resolvedVariantColor === "green" || resolvedVariantColor === "gold"
      ? resolvedVariantColor
      : "blue";

  return (
    <Card variantColor={resolvedVariantColor} {...props}>
      <Column>
        <Row gap="sm" justify="between" align="center">
          <Title truncate>{teamName}</Title>
          <Text variantWeight="semibold" variantSize="base">
            {team.points * pointScale} 포인트
          </Text>
        </Row>
        <Bar variantColor={barVariantColor} />
        <PresetMemberGrid
          presetMembers={members}
          onMemberClick={() => {}}
          connectedMemberIds={connectedMemberIds}
          clientMemberId={clientMemberId}
        />
      </Column>
    </Card>
  );
}
