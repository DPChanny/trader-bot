import { DeleteButton, EditButton } from "@/app/components/atoms/button";
import { Badge } from "@/app/components/molecules/badge";
import { Card, type CardProps } from "@/app/components/atoms/card";
import { Row } from "@/app/components/atoms/layout";
import type { PositionDTO } from "@/dtos/position";
import { Role } from "@/dtos/member";
import { useVerifyRole } from "@/hooks/member";
import styles from "@/app/styles/pages/presetPage/positionEditor/positionCard.module.css";

type PositionCardProps = Omit<CardProps, "children"> & {
  position: PositionDTO;
  guildId: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeletePending: boolean;
};

export function PositionCard({
  position,
  guildId,
  onEdit,
  onDelete,
  isDeletePending,
  ...props
}: PositionCardProps) {
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
  return (
    <Card {...props}>
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
