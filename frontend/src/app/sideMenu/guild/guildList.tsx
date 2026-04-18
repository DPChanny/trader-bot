import { Scroll } from "@components/atoms/layout";
import {
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { GuildCard } from "./guildCard";
import type { GuildDetailDTO } from "@dtos/guild";
import { Title } from "@components/atoms/text";

interface GuildListProps {
  guilds: GuildDetailDTO[];
  activeGuildId: string | null;
}

export function GuildList({ guilds, activeGuildId }: GuildListProps) {
  return (
    <SecondarySection fill minSize>
      <Title>길드 관리</Title>
      <TertiarySection fill minSize>
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
