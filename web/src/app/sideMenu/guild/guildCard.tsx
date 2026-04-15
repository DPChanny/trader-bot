import { Card, type CardProps } from "@components/atoms/card";
import { Image } from "@components/atoms/image";
import { FlexItem, Row } from "@components/atoms/layout";
import { Link } from "@components/atoms/link";
import { Name } from "@components/atoms/text";
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
      aria-current={isSelected ? "page" : undefined}
    >
      <Card {...props}>
        <Row>
          <Image src={guild.iconUrl} alt={guild.name} />
          <FlexItem>
            <Name>{guild.name}</Name>
          </FlexItem>
        </Row>
      </Card>
    </Link>
  );
}
