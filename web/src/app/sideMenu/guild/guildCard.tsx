import { Card, type CardProps } from "@/app/components/atoms/card";
import { Image } from "@/app/components/atoms/image";
import { Row } from "@/app/components/atoms/layout";
import { Link } from "@/app/components/atoms/link";
import styles from "@/app/styles/sideMenu/guild/guildCard.module.css";
import type { GuildDetailDTO } from "@/dtos/guild";

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
