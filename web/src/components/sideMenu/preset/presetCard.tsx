import { Card } from "@/components/commons/card";
import styles from "@/styles/components/sideMenu/preset/presetCard.module.css";
import type { PresetDTO } from "@/dtos/preset";

interface PresetCardProps {
  preset: PresetDTO;
  guildId: string;
  isActive?: boolean;
}

export function PresetCard({ preset, guildId, isActive }: PresetCardProps) {
  return (
    <a
      href={`/guild/${guildId}/preset/${preset.presetId}`}
      style={{ display: "contents", textDecoration: "none", color: "inherit" }}
    >
      <Card
        variantColor={isActive ? "blue" : "gray"}
        variantActive={isActive}
        variantLayout="row"
        variantIntent="tertiary"
        style={{ cursor: "pointer" }}
      >
        <span className={styles.name}>{preset.name}</span>
      </Card>
    </a>
  );
}
