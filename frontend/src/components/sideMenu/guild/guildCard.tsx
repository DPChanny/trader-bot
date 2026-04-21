import { Card } from "@components/surfaces/card";
import { Image } from "@components/atoms/image";
import { Link } from "@components/atoms/link";
import { Name } from "@components/atoms/text";
import type { GuildDetailDTO } from "@dtos/guild";

type GuildCardProps = {
  guild: GuildDetailDTO;
  isSelected?: boolean;
};

export function GuildCard({ guild, isSelected }: GuildCardProps) {
  return (
    <Link
      href={`/guild/${guild.discordId}/member`}
      aria-current={isSelected ? "page" : undefined}
    >
      <Card direction="row" align="center" justify="center">
        <Image src={guild.iconUrl} alt={guild.name} />
        <Name>{guild.name}</Name>
      </Card>
    </Link>
  );
}
