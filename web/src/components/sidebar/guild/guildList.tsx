import { route } from "preact-router";
import { Section } from "@/components/commons/section";
import { Bar } from "@/components/commons/bar";
import { GuildCard } from "./guildCard";
import styles from "@/styles/components/sidebar/guild/guildList.module.css";
import type { GuildDTO } from "@/dtos/guildDto";

interface GuildListProps {
  guilds: GuildDTO[];
  activeGuildId: string | null;
}

export function GuildList({ guilds, activeGuildId }: GuildListProps) {
  return (
    <Section variantTone="ghost" variantIntent="secondary">
      <Section variantTone="ghost" variantLayout="row">
        <h3 className={styles.title}>길드</h3>
      </Section>
      <Bar />
      <Section
        variantTone="ghost"
        variantLayout="column"
        className={styles.list}
      >
        {guilds.map((g) => (
          <GuildCard
            key={g.discordId}
            guild={g}
            isActive={activeGuildId === g.discordId}
            onClick={() => route(`/guild/${g.discordId}`)}
          />
        ))}
      </Section>
    </Section>
  );
}
