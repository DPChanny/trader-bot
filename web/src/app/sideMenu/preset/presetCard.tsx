import { Card } from "@components/molecules/card";
import { Link } from "@components/atoms/link";
import { Name } from "@components/atoms/text";
import type { PresetDTO } from "@dtos/preset";

type PresetCardProps = {
  preset: PresetDTO;
  guildId: string;
  isSelected?: boolean;
};

export function PresetCard({ preset, guildId, isSelected }: PresetCardProps) {
  return (
    <Link
      href={`/guild/${guildId}/preset/${preset.presetId}`}
      aria-current={isSelected ? "page" : undefined}
    >
      <Card direction="row" align="center" justify="center">
        <Name>{preset.name}</Name>
      </Card>
    </Link>
  );
}
