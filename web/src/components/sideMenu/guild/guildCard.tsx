import { Card } from "@/components/commons/card";
import styles from "@/styles/components/sideMenu/guild/guildCard.module.css";
import type { GuildDetailDTO } from "@/dtos/guild";

interface GuildCardProps {
  guild: GuildDetailDTO;
  isActive?: boolean;
}

export function GuildCard({ guild, isActive }: GuildCardProps) {
  return (
    <a
      href={`/guild/${guild.discordId}/member`}
      style={{ display: "contents", textDecoration: "none", color: "inherit" }}
    >
      <Card
        variantColor={isActive ? "blue" : "gray"}
        variantActive={isActive}
        variantLayout="row"
        variantIntent="tertiary"
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
    </a>
  );
}
