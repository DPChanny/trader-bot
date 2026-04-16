import { Card } from "@components/molecules/card";
import { Link } from "@components/atoms/link";
import { Name } from "@components/atoms/text";
import type { PresetDTO } from "@dtos/preset";
import { useGuildId } from "@hooks/router";

type PresetCardProps = {
  preset: PresetDTO;
  isSelected?: boolean;
};

export function PresetCard({ preset, isSelected }: PresetCardProps) {
  const guildId = useGuildId()!;
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
