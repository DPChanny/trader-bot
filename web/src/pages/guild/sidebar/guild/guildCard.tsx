import { Card } from "@/components/commons/card";
import { Section } from "@/components/commons/section";
import styles from "@/styles/components/sidebar/guildCard.module.css";
import type { GuildDTO } from "@/dtos/guildDto";

interface GuildCardProps {
  guild: GuildDTO;
  isActive?: boolean;
  onClick: () => void;
}

export function GuildCard({ guild, isActive, onClick }: GuildCardProps) {
  return (
    <button type="button" className={styles.guildCardBtn} onClick={onClick}>
      <Card
        variantColor={isActive ? "blue" : "gray"}
        variantActive={isActive}
        variantTone="solid"
        variantLayout="row"
        className={styles.guildCard}
      >
        <Section
          variantTone="ghost"
          variantLayout="row"
          className={styles.guildCardInner}
        >
          <div className={styles.guildIcon}>
            {guild.iconUrl ? (
              <img src={guild.iconUrl} alt={guild.name} />
            ) : (
              <span className={styles.guildIconFallback}>🎮</span>
            )}
          </div>
          <span className={styles.guildName}>{guild.name}</span>
        </Section>
      </Card>
    </button>
  );
}
