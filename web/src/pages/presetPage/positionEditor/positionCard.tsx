import { DeleteButton, EditButton } from "@/components/commons/button";
import { Badge } from "@/components/commons/badge";
import { Card } from "@/components/commons/card";
import { Row } from "@/components/commons/layout";
import type { PositionDTO } from "@/dtos/position";
import { Role } from "@/dtos/member";
import { useVerifyRole } from "@/hooks/member";
import styles from "@/styles/pages/presetPage/positionEditor/positionCard.module.css";

interface PositionCardProps {
  position: PositionDTO;
  guildId: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeletePending: boolean;
}

export function PositionCard({
  position,
  guildId,
  onEdit,
  onDelete,
  isDeletePending,
}: PositionCardProps) {
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
  return (
    <Card variantIntent="tertiary">
      <Row>
        <Badge
          src={position.iconUrl || undefined}
          alt={position.name}
          variantColor="blue"
          variantSize="large"
        >
          {position.name.charAt(0)}
        </Badge>
        <span className={styles.name}>{position.name}</span>

        {canEdit && (
          <Row>
            <EditButton variantSize="small" onClick={onEdit} />
            <DeleteButton
              variantSize="small"
              disabled={isDeletePending}
              onClick={onDelete}
            />
          </Row>
        )}
      </Row>
    </Card>
  );
}
