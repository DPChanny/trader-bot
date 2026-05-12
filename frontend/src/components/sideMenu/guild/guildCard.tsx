import { Card } from "@components/surfaces/card";
import { Image } from "@components/atoms/image";
import { InternalLink } from "@components/atoms/link";
import { Name } from "@components/atoms/text";
import type { GuildDetailDTO } from "@features/guild/dto";

type GuildCardProps = {
  guild: GuildDetailDTO;
  isSelected?: boolean;
};

export function GuildCard({ guild, isSelected }: GuildCardProps) {
  return (
    <InternalLink
      to="/guild/$guildId/member"
      params={{ guildId: guild.discordId }}
      search={{ authKey: undefined, code: undefined }}
      aria-current={isSelected ? "page" : undefined}
    >
      <Card direction="row" align="center" justify="center">
        <Image src={guild.iconUrl} alt={guild.name} />
        <Name>{guild.name}</Name>
      </Card>
    </InternalLink>
  );
}
