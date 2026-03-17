import { DeleteButton, EditButton } from "@/components/button";
import type { Preset } from "@/dto";
import { Card } from "@/components/card";
import { Section } from "@/components/section";
import styles from "@/styles/pages/preset/presetCard.module.css";

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
