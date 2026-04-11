import { route } from "preact-router";
import { Section } from "@/components/commons/section";
import { Bar } from "@/components/commons/bar";
import { PrimaryButton } from "@/components/commons/button";
import { GuildCard } from "./guildCard";
import type { GuildDTO } from "@/dtos/guildDto";
import { getBotInviteUrl } from "@/utils/env";
import styles from "@/styles/components/sideMenu/guild/guildList.module.css";

interface GuildListProps {
  guilds: GuildDTO[];
  activeGuildId: string | null;
}

export function GuildList({ guilds, activeGuildId }: GuildListProps) {
  return (
    <Section variantIntent="secondary" className={styles.wrapper}>
      <Section variantTone="ghost" variantLayout="row">
        <h3>길드 관리</h3>
        <PrimaryButton onClick={() => window.open(getBotInviteUrl(), "_blank")}>
          추가
        </PrimaryButton>
      </Section>
      <Bar />
      <Section
        variantTone="ghost"
        variantLayout="column"
        variantIntent="secondary"
      >
        {guilds.map((g) => (
          <GuildCard
            key={g.discordId}
            guild={g}
            isActive={activeGuildId === g.discordId}
            onClick={() => route(`/guild/${g.discordId}/member`)}
          />
        ))}
      </Section>
    </Section>
  );
}
