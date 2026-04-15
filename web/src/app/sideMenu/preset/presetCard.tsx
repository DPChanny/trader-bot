import { Card, type CardProps } from "@components/atoms/card";
import { FlexItem, Row } from "@components/atoms/layout";
import { Link } from "@components/atoms/link";
import { Text } from "@components/atoms/text";
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
      <Card {...props}>
        <Row>
          <FlexItem>
            <Text truncate>{preset.name}</Text>
          </FlexItem>
        </Row>
      </Card>
    </Link>
  );
}
