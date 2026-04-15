import { Card, type CardProps } from "@/components/commons/card";
import { Row } from "@/components/commons/layout";
import { Link } from "@/components/commons/link";
import styles from "@/styles/components/sideMenu/guild/guildCard.module.css";
import type { GuildDetailDTO } from "@/dtos/guild";

type GuildCardProps = Omit<CardProps, "children"> & {
  guild: GuildDetailDTO;
  isSelected?: boolean;
};

export function GuildCard({ guild, isSelected, ...props }: GuildCardProps) {
  return (
    <Link
      href={`/guild/${guild.discordId}/member`}
      variantStyle="plain"
      variantDisplay="block"
      aria-current={isSelected ? "page" : undefined}
    >
      <Card {...props}>
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
    </Link>
  );
}
