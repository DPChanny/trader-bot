import { Card } from "@/components/commons/card";
import { Section } from "@/components/commons/section";
import { EditButton, DeleteButton } from "@/components/commons/button";
import styles from "@/styles/components/sidebar/presetCard.module.css";
import type { PresetDTO } from "@/dtos/presetDto";

interface PresetCardProps {
  preset: PresetDTO;
  isActive?: boolean;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function PresetCard({
  preset,
  isActive,
  onClick,
  onEdit,
  onDelete,
}: PresetCardProps) {
  return (
    <Card
      variantColor={isActive ? "blue" : "gray"}
      variantActive={isActive}
      variantTone="solid"
      variantLayout="row"
      className={styles.presetCard}
    >
      <button type="button" className={styles.presetNameBtn} onClick={onClick}>
        <Section
          variantTone="ghost"
          variantLayout="row"
          className={styles.presetInner}
        >
          <span className={styles.presetName}>{preset.name}</span>
        </Section>
      </button>

      <Section
        variantTone="ghost"
        variantLayout="row"
        className={styles.presetActions}
      >
        <EditButton
          variantSize="small"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        />
        <DeleteButton
          variantSize="small"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        />
      </Section>
    </Card>
  );
}
