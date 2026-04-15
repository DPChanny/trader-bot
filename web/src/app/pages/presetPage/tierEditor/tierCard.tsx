import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/molecules/badge";
import { Card, type CardProps } from "@components/molecules/card";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
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
    <Card {...props} direction="row" justify="between" align="center">
      <Badge variantColor="red" variantSize="large">
        {tier.iconUrl ? (
          <Image src={tier.iconUrl} alt={tier.name} variantSize="auto" />
        ) : (
          tier.name.charAt(0)
        )}
      </Badge>
      <Name>{tier.name}</Name>

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
