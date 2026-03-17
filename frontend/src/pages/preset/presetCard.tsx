import { DeleteButton, EditButton } from "@/components/button";
import type { Preset } from "@/dto";
import { Section } from "@/components/section";
import { cva } from "class-variance-authority";
import styles from "@/styles/pages/preset/presetCard.module.css";

const presetCardVariants = cva(styles.card, {
  variants: {
    variantActive: {
      true: styles.activeTrue,
      false: "",
    },
  },
  defaultVariants: {
    variantActive: false,
  },
});

interface PresetCardProps {
  preset: Preset;
  isActive: boolean;
  onSelect: (presetId: number) => void;
  onEdit: (presetId: number) => void;
  onDelete: (presetId: number) => void;
}

export function PresetCard({
  preset,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: PresetCardProps) {
  const handleStopPropagation = (e: Event) => {
    e.stopPropagation();
  };

  return (
    <Section
      variantType="tertiary"
      variantLayout="row"
      className={presetCardVariants({ variantActive: isActive })}
    >
      <div
        className={styles.cardContent}
        onClick={() => onSelect(preset.presetId)}
      >
        <div className={styles.cardInfo}>
          <span className={styles.cardName}>{preset.name}</span>
          <div className={styles.cardDetails}>
            <span className={styles.cardDetail}>
              포인트: {preset.points * preset.pointScale}
            </span>
            <span className={styles.cardDetail}>타이머: {preset.time}초</span>
            <span className={styles.cardDetail}>통계: {preset.statistics}</span>
          </div>
        </div>
      </div>
      <div className={styles.cardActions} onClick={handleStopPropagation}>
        <EditButton
          variantSize="small"
          onClick={() => onEdit(preset.presetId)}
        />
        <DeleteButton
          variantSize="small"
          onClick={() => onDelete(preset.presetId)}
        />
      </div>
    </Section>
  );
}
