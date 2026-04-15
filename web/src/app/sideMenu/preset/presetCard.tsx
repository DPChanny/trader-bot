import { Card, type CardProps } from "@components/atoms/card";
import { Row } from "@components/atoms/layout";
import { Link } from "@components/atoms/link";
import styles from "@styles/sideMenu/preset/presetCard.module.css";
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
      className={styles.link}
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
