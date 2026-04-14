import { Card } from "@/components/commons/card";
import { Row } from "@/components/commons/layout";
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
      className={styles.link}
      aria-current={isActive ? "page" : undefined}
    >
      <Card
        variantColor="blue"
        variantActive={isActive}
        variantIntent="tertiary"
      >
        <Row>
          <div className={styles.icon}>
            {guild.iconUrl ? (
              <img src={guild.iconUrl} alt={guild.name} />
            ) : (
              <span className={styles.iconFallback}>🎮</span>
            )}
          </div>
          <span className={styles.name}>{guild.name}</span>
        </Row>
      </Card>
    </a>
  );
}
