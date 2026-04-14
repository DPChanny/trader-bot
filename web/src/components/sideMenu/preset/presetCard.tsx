import { Card } from "@/components/commons/card";
import { Row } from "@/components/commons/layout";
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
      className={styles.link}
      aria-current={isActive ? "page" : undefined}
    >
      <Card
        variantColor="blue"
        variantActive={isActive}
        variantIntent="tertiary"
      >
        <Row>
          <span className={styles.name}>{preset.name}</span>
        </Row>
      </Card>
    </a>
  );
}
