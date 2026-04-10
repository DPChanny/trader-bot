import { Card } from "@/components/commons/card";
import { Section } from "@/components/commons/section";
import { EditButton, DeleteButton } from "@/components/commons/button";
import styles from "@/styles/components/sideMenu/preset/presetCard.module.css";
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
      variantLayout="row"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <span className={styles.name}>{preset.name}</span>

      <Section variantTone="ghost" variantLayout="row" variantIntent="tertiary">
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
