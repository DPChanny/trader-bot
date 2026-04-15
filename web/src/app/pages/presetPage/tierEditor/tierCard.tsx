import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/molecules/badge";
import { Card, type CardProps } from "@components/atoms/card";
import { FlexItem, Row } from "@components/atoms/layout";
import { Text } from "@components/atoms/text";
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
        <Badge
          src={tier.iconUrl || undefined}
          alt={tier.name}
          variantColor="red"
          variantSize="large"
        >
          {tier.name.charAt(0)}
        </Badge>
        <FlexItem>
          <Text truncate>{tier.name}</Text>
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
