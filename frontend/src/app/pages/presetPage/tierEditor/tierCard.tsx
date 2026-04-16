import { useState } from "preact/hooks";
import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/atoms/badge";
import { Card } from "@components/molecules/card";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
import { Name } from "@components/atoms/text";
import type { TierDTO } from "@dtos/tier";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { UpdateTierModal } from "./updateTierModal";
import { DeleteTierModal } from "./deleteTierModal";

type TierCardProps = {
  tier: TierDTO;
  guildId: string;
  presetId: number;
};

export function TierCard({ tier, guildId, presetId }: TierCardProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
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

      {canEdit && (
        <Row align="center">
          <EditButton variantSize="small" onClick={() => setShowUpdate(true)} />
          <DeleteButton
            variantSize="small"
            onClick={() => setShowDelete(true)}
          />
        </Row>
      )}

      {showUpdate && (
        <UpdateTierModal
          guildId={guildId}
          presetId={presetId}
          tier={tier}
          onClose={() => setShowUpdate(false)}
        />
      )}
      {showDelete && (
        <DeleteTierModal
          guildId={guildId}
          presetId={presetId}
          tierId={tier.tierId}
          onClose={() => setShowDelete(false)}
        />
      )}
    </Card>
  );
}
