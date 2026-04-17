import { Row, Scroll } from "@components/atoms/layout";
import {
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { PrimaryButton } from "@components/atoms/button";
import { GuildCard } from "./guildCard";
import type { GuildDetailDTO } from "@dtos/guild";
import { BOT_INVITE_URL, BOT_INVITE_URL_TEXT } from "@utils/env";
import { Title } from "@components/atoms/text";
import { Link } from "@components/atoms/link";

interface GuildListProps {
  guilds: GuildDetailDTO[];
  activeGuildId: string | null;
}

export function GuildList({ guilds, activeGuildId }: GuildListProps) {
  return (
    <SecondarySection fill minSize>
      <Row justify="between" align="center">
        <Title>길드 관리</Title>
        <Link href={BOT_INVITE_URL} target="_blank" rel="noreferrer">
          <PrimaryButton>{BOT_INVITE_URL_TEXT}</PrimaryButton>
        </Link>
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
