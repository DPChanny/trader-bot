import { Row, Scroll } from "@components/atoms/layout";
import {
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { PrimaryButton } from "@components/atoms/button";
import { GuildCard } from "./guildCard";
import type { GuildDetailDTO } from "@dtos/guild";
import { GUILD_INVITE_BUTTON_TEXT, GUILD_INVITE_URL } from "@utils/env";
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
        <PrimaryButton onClick={() => window.open(GUILD_INVITE_URL, "_blank")}>
          {GUILD_INVITE_BUTTON_TEXT}
        </PrimaryButton>
      </Row>
      <TertiarySection fill>
        <Scroll axis="y">
          {guilds.map((g) => (
            <GuildCard
              key={g.discordId}
              guild={g}
              isSelected={activeGuildId === g.discordId}
            />
          ))}
        </Scroll>
      </TertiarySection>
    </SecondarySection>
  );
}
