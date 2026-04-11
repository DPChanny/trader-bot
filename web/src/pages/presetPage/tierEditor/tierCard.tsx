import { DeleteButton, EditButton } from "@/components/commons/button";
import { Badge } from "@/components/commons/badge";
import { Card } from "@/components/commons/card";
import { Section } from "@/components/commons/section";
import type { TierDTO } from "@/dtos/tierDto";
import styles from "@/styles/pages/guild/presetPage/tierEditor/tierCard.module.css";

interface TierCardProps {
  tier: TierDTO;
  onEdit: () => void;
  onDelete: () => void;
  isDeletePending: boolean;
}

export function TierCard({
  tier,
  onEdit,
  onDelete,
  isDeletePending,
}: TierCardProps) {
  return (
    <Card variantLayout="row" variantIntent="tertiary">
      <Badge
        src={tier.iconUrl || undefined}
        alt={tier.name}
        variantColor="red"
        variantSize="large"
      >
        {tier.name.charAt(0)}
      </Badge>
      <span className={styles.name}>{tier.name}</span>

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
