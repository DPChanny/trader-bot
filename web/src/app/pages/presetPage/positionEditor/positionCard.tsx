import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/molecules/badge";
import { Card, type CardProps } from "@components/atoms/card";
import { Row } from "@components/atoms/layout";
import { CaptionStrong } from "@components/atoms/text";
import type { PositionDTO } from "@dtos/position";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import styles from "@styles/pages/presetPage/positionEditor/positionCard.module.css";

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
        <span className={styles.name}>
          <CaptionStrong>{position.name}</CaptionStrong>
        </span>

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
