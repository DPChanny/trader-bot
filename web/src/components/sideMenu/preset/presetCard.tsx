import { Card } from "@/components/commons/card";
import styles from "@/styles/components/sideMenu/preset/presetCard.module.css";
import type { PresetDTO } from "@/dtos/presetDto";

interface PresetCardProps {
  preset: PresetDTO;
  isActive?: boolean;
  onClick: () => void;
}

export function PresetCard({ preset, isActive, onClick }: PresetCardProps) {
  return (
    <Card
      variantColor={isActive ? "blue" : "gray"}
      variantActive={isActive}
      variantLayout="row"
      variantIntent="tertiary"
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      <span className={styles.name}>{preset.name}</span>
    </Card>
  );
}
