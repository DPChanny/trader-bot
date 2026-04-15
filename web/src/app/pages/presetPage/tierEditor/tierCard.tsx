import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/molecules/badge";
import { Card, type CardProps } from "@components/atoms/card";
import { Image } from "@components/atoms/image";
import { FlexItem, Row } from "@components/atoms/layout";
import { Name } from "@components/atoms/text";
import type { TierDTO } from "@dtos/tier";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";

type TierCardProps = Omit<CardProps, "children"> & {
  tier: TierDTO;
  guildId: string;
  onEdit: () => void;
  onDelete: () => void;
  isDeletePending: boolean;
};

export function TierCard({
  tier,
  guildId,
  onEdit,
  onDelete,
  isDeletePending,
  ...props
}: TierCardProps) {
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
  return (
    <Card {...props}>
      <Row>
        <Badge variantColor="red" variantSize="large">
          {tier.iconUrl ? (
            <Image src={tier.iconUrl} alt={tier.name} variantSize="auto" />
          ) : (
            tier.name.charAt(0)
          )}
        </Badge>
        <FlexItem>
          <Name>{tier.name}</Name>
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
