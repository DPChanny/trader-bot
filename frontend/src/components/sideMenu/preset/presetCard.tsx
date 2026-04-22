import { Card } from "@components/surfaces/card";
import { InternalLink } from "@components/atoms/link";
import { Routes } from "@utils/routes";
import { Name } from "@components/atoms/text";
import type { PresetDTO } from "@features/preset/dto";
import { useGuildId } from "@hooks/route";

type PresetCardProps = {
  preset: PresetDTO;
  isSelected?: boolean;
};

export function PresetCard({ preset, isSelected }: PresetCardProps) {
  const guildId = useGuildId();
  return (
    <InternalLink
      href={Routes.guild.preset.to(guildId, preset.presetId)}
      aria-current={isSelected ? "page" : undefined}
    >
      <Card direction="row" align="center" justify="center">
        <Name>{preset.name}</Name>
      </Card>
    </InternalLink>
  );
}
