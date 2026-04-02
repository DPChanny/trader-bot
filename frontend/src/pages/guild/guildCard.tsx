import { Card } from "@/components/card";
import { Section } from "@/components/section";
import type { GuildDTO } from "@/dtos";

interface GuildCardProps {
  guild: GuildDTO;
  isActive?: boolean;
  onClick: (guildId: number) => void;
}

export function GuildCard({ guild, isActive, onClick }: GuildCardProps) {
  return (
    <Card
      variantColor="blue"
      variantActive={isActive}
      variantLayout="row"
      onClick={() => onClick(guild.guildId)}
      style={{ cursor: "pointer" }}
    >
      <Section variantTone="ghost" variantIntent="secondary">
        <h3>{guild.name}</h3>
      </Section>
    </Card>
  );
}
