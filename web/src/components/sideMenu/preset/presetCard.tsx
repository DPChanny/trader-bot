import { Card, type CardProps } from "@/components/commons/card";
import { Row } from "@/components/commons/layout";
import styles from "@/styles/components/sideMenu/preset/presetCard.module.css";
import type { PresetDTO } from "@/dtos/preset";

type PresetCardProps = Omit<CardProps, "children"> & {
  preset: PresetDTO;
  guildId: string;
};

export function PresetCard({
  preset,
  guildId,
  variantSelected,
  variantColor = "blue",
  ...props
}: PresetCardProps) {
  return (
    <a
      href={`/guild/${guildId}/preset/${preset.presetId}`}
      className={styles.link}
      aria-current={variantSelected ? "page" : undefined}
    >
      <Card
        variantColor={variantColor}
        variantSelected={variantSelected}
        {...props}
      >
        <Row>
          <span className={styles.name}>{preset.name}</span>
        </Row>
      </Card>
    </a>
  );
}
