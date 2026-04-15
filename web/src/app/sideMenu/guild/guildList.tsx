import { Row, Scroll } from "@/app/components/atoms/layout";
import { SecondarySection } from "@/app/components/molecules/section";
import { PrimaryButton } from "@/app/components/atoms/button";
import { GuildCard } from "./guildCard";
import type { GuildDetailDTO } from "@/dtos/guild";
import { getBotInviteUrl } from "@/utils/env";
import { Bar } from "@/app/components/atoms/bar";

interface GuildListProps {
  guilds: GuildDetailDTO[];
  activeGuildId: string | null;
}

export function GuildList({ guilds, activeGuildId }: GuildListProps) {
  return (
    <SecondarySection fill minSize>
      <Row justify="between" align="center">
        <h3>길드 관리</h3>
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
