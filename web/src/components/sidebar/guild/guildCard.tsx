import { Card } from "@/components/commons/card";
import styles from "@/styles/components/sidebar/guild/guildCard.module.css";
import type { GuildDTO } from "@/dtos/guildDto";

interface GuildCardProps {
  guild: GuildDTO;
  isActive?: boolean;
  onClick: () => void;
}

export function GuildCard({ guild, isActive, onClick }: GuildCardProps) {
  return (
    <Card
      variantColor={isActive ? "blue" : "gray"}
      variantActive={isActive}
      variantLayout="row"
      className={styles.card}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <div className={styles.icon}>
        {guild.iconUrl ? (
          <img src={guild.iconUrl} alt={guild.name} />
        ) : (
          <span className={styles.iconFallback}>🎮</span>
        )}
      </div>
      <span className={styles.name}>{guild.name}</span>
    </Card>
  );
}
