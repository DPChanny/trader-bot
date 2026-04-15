import { Card, type CardProps } from "@components/atoms/card";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
import { Link } from "@components/atoms/link";
import styles from "@styles/sideMenu/guild/guildCard.module.css";
import type { GuildDetailDTO } from "@dtos/guild";

type GuildCardProps = Omit<CardProps, "children"> & {
  guild: GuildDetailDTO;
  isSelected?: boolean;
};

export function GuildCard({ guild, isSelected, ...props }: GuildCardProps) {
  return (
    <Link
      href={`/guild/${guild.discordId}/member`}
      variantContent="div"
      className={styles.link}
      aria-current={isSelected ? "page" : undefined}
    >
      <Card {...props}>
        <Row>
          <Image src={guild.iconUrl} alt={guild.name} variantSize="small" />
          <span className={styles.name}>{guild.name}</span>
        </Row>
      </Card>
    </Link>
  );
}
