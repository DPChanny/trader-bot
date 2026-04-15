import { Card, type CardProps } from "@components/molecules/card";
import { Link } from "@components/atoms/link";
import { Name } from "@components/atoms/text";
import type { PresetDTO } from "@dtos/preset";

type PresetCardProps = Omit<CardProps, "children"> & {
  preset: PresetDTO;
  guildId: string;
  isSelected?: boolean;
};

export function PresetCard({
  preset,
  guildId,
  isSelected,
  ...props
}: PresetCardProps) {
  return (
    <Link
      href={`/guild/${guildId}/preset/${preset.presetId}`}
      variantContent="div"
      aria-current={isSelected ? "page" : undefined}
    >
      <Card {...props} direction="row" align="center" justify="center">
        <Name>{preset.name}</Name>
      </Card>
    </Link>
  );
}
