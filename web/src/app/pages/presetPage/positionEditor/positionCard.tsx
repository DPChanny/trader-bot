import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/molecules/badge";
import { Card, type CardProps } from "@components/molecules/card";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
import { Name } from "@components/atoms/text";
import type { PositionDTO } from "@dtos/position";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";

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
    <Card {...props} direction="row" justify="between" align="center">
      <Badge variantColor="blue" variantSize="large">
        {position.iconUrl ? (
          <Image
            src={position.iconUrl}
            alt={position.name}
            variantSize="auto"
          />
        ) : (
          position.name.charAt(0)
        )}
      </Badge>
      <Name>{position.name}</Name>
      {canEdit && (
        <Row align="center">
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
