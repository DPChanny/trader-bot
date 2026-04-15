import { DeleteButton, EditButton } from "@/app/components/atoms/button";
import { Badge } from "@/app/components/molecules/badge";
import { Card, type CardProps } from "@/app/components/atoms/card";
import { Row } from "@/app/components/atoms/layout";
import type { TierDTO } from "@/dtos/tier";
import { Role } from "@/dtos/member";
import { useVerifyRole } from "@/hooks/member";
import styles from "@/app/styles/pages/presetPage/tierEditor/tierCard.module.css";

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
        <span className={styles.name}>{tier.name}</span>

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
