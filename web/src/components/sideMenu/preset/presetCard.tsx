import { Card, type CardProps } from "@/components/commons/card";
import { Row } from "@/components/commons/layout";
import { Link } from "@/components/commons/link";
import styles from "@/styles/components/sideMenu/preset/presetCard.module.css";
import type { PresetDTO } from "@/dtos/preset";

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
      variantStyle="plain"
      variantDisplay="block"
      aria-current={isSelected ? "page" : undefined}
    >
      <Card {...props}>
        <Row>
          <span className={styles.name}>{preset.name}</span>
        </Row>
      </Card>
    </Link>
  );
}
