import { DeleteButton, EditButton } from "@/components/commons/button";
import { Badge } from "@/components/commons/badge";
import { Card } from "@/components/commons/card";
import { Row } from "@/components/commons/layout";
import type { TierDTO } from "@/dtos/tier";
import { Role } from "@/dtos/member";
import { useVerifyRole } from "@/hooks/member";
import styles from "@/styles/pages/presetPage/tierEditor/tierCard.module.css";

interface TierCardProps {
  tier: TierDTO;
  guildId: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeletePending: boolean;
}

export function TierCard({
  tier,
  guildId,
  onEdit,
  onDelete,
  isDeletePending,
}: TierCardProps) {
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
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

      {canEdit && (
        <Row gap="xs">
          <EditButton variantSize="small" onClick={onEdit} />
          <DeleteButton
            variantSize="small"
            disabled={isDeletePending}
            onClick={onDelete}
          />
        </Row>
      )}
    </Card>
  );
}
