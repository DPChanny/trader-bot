import { DeleteButton, EditButton } from "@/components/commons/button";
import { Badge } from "@/components/commons/badge";
import { Card } from "@/components/commons/card";
import { Section } from "@/components/commons/section";
import type { PositionDTO } from "@/dtos/positionDto";
import styles from "@/styles/pages/guild/presetPage/positionEditor/positionCard.module.css";

interface PositionCardProps {
  position: PositionDTO;
  onEdit: () => void;
  onDelete: () => void;
  isDeletePending: boolean;
}

export function PositionCard({
  position,
  onEdit,
  onDelete,
  isDeletePending,
}: PositionCardProps) {
  return (
    <Card variantLayout="row" variantIntent="secondary">
      <Badge
        src={position.iconUrl || undefined}
        alt={position.name}
        variantColor="blue"
        variantSize="large"
      >
        {position.name.charAt(0)}
      </Badge>
      <span className={styles.name}>{position.name}</span>

      <Section variantTone="ghost" variantLayout="row" variantIntent="tertiary">
        <EditButton variantSize="small" onClick={onEdit} />
        <DeleteButton
          variantSize="small"
          disabled={isDeletePending}
          onClick={onDelete}
        />
      </Section>
    </Card>
  );
}
