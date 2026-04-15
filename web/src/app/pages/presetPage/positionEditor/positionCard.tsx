import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/molecules/badge";
import { Card, type CardProps } from "@components/atoms/card";
import { Image } from "@components/atoms/image";
import { FlexItem, Row } from "@components/atoms/layout";
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
    <Card {...props}>
      <Row>
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
        <FlexItem>
          <Name>{position.name}</Name>
        </FlexItem>

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
