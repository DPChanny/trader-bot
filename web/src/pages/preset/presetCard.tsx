import { DeleteButton, EditButton } from "@/components/commons/button";
import type { PresetDTO } from "@/dtos/presetDto";
import { Card } from "@/components/commons/card";
import { Section } from "@/components/commons/section";
import styles from "@/styles/pages/preset/presetCard.module.css";

interface PresetCardProps {
  preset: PresetDTO;
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
    <Card
      variantLayout="row"
      variantActive={isActive}
      onClick={() => onSelect(preset.presetId)}
    >
      <span className={styles.name}>{preset.name}</span>
      <Section
        variantTone="ghost"
        variantIntent="tertiary"
        variantLayout="row"
        onClick={handleStopPropagation}
      >
        <EditButton
          variantSize="small"
          onClick={() => onEdit(preset.presetId)}
        />
        <DeleteButton
          variantSize="small"
          onClick={() => onDelete(preset.presetId)}
        />
      </Section>
    </Card>
  );
}
