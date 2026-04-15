import { Row, Scroll } from "@components/atoms/layout";
import { SecondarySection } from "@components/molecules/section";
import { PrimaryButton } from "@components/atoms/button";
import { GuildCard } from "./guildCard";
import type { GuildDetailDTO } from "@dtos/guild";
import { getBotInviteUrl } from "@utils/env";
import { Bar } from "@components/atoms/bar";
import { Title } from "@components/atoms/text";

interface GuildListProps {
  guilds: GuildDetailDTO[];
  activeGuildId: string | null;
}

export function GuildList({ guilds, activeGuildId }: GuildListProps) {
  return (
    <SecondarySection fill minSize>
      <Row justify="between" align="center">
        <Title>길드 관리</Title>
        <PrimaryButton onClick={() => window.open(getBotInviteUrl(), "_blank")}>
          추가
        </PrimaryButton>
      </Row>
      <Bar />
      <Scroll axis="y" gap="xs">
        {guilds.map((g) => (
          <GuildCard
            key={g.discordId}
            guild={g}
            isSelected={activeGuildId === g.discordId}
          />
        ))}
      </Scroll>
    </SecondarySection>
  );
}
