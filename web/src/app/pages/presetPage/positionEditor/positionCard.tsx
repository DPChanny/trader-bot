import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/atoms/badge";
import { Card } from "@components/molecules/card";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
import { Name } from "@components/atoms/text";
import type { PositionDTO } from "@dtos/position";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";

type PositionCardProps = {
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
}: PositionCardProps) {
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
  return (
    <Card direction="row" justify="between" align="center">
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
