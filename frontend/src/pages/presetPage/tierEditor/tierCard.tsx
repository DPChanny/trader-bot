import { useState } from "preact/hooks";
import { useGuildId } from "@hooks/router";
import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/atoms/badge";
import { Card } from "@components/surfaces/card";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
import { Name } from "@components/atoms/text";
import type { TierDTO } from "@features/tier/dto";
import { Role } from "@features/member/dto";
import { useVerifyRole } from "@features/member/hook";
import { UpdateTierModal } from "./updateTierModal";
import { DeleteTierModal } from "./deleteTierModal";

type TierCardProps = {
  tier: TierDTO;
};

export function TierCard({ tier }: TierCardProps) {
  const guildId = useGuildId();
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
  const canDelete = useVerifyRole(guildId, Role.ADMIN);
  return (
    <Card direction="row" justify="between" align="center">
      <Badge variantColor="red" variantSize="large">
        {tier.iconUrl ? (
          <Image src={tier.iconUrl} alt={tier.name} variantSize="auto" />
        ) : (
          tier.name.charAt(0)
        )}
      </Badge>
      <Name>{tier.name}</Name>

      {(canEdit || canDelete) && (
        <Row align="center">
          {canEdit && (
            <EditButton
              variantSize="small"
              onClick={() => setShowUpdate(true)}
            />
          )}
          {canDelete && (
            <DeleteButton
              variantSize="small"
              onClick={() => setShowDelete(true)}
            />
          )}
        </Row>
      )}

      {showUpdate && (
        <UpdateTierModal tier={tier} onClose={() => setShowUpdate(false)} />
      )}
      {showDelete && (
        <DeleteTierModal
          tierId={tier.tierId}
          onClose={() => setShowDelete(false)}
        />
      )}
    </Card>
  );
}

