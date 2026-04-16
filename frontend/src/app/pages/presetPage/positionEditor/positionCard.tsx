import { useState } from "preact/hooks";
import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/atoms/badge";
import { Card } from "@components/molecules/card";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
import { Name } from "@components/atoms/text";
import type { PositionDTO } from "@dtos/position";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { UpdatePositionModal } from "./updatePositionModal";
import { DeletePositionModal } from "./deletePositionModal";

type PositionCardProps = {
  position: PositionDTO;
  guildId: string;
  presetId: number;
};

export function PositionCard({
  position,
  guildId,
  presetId,
}: PositionCardProps) {
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
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
          <EditButton variantSize="small" onClick={() => setShowUpdate(true)} />
          <DeleteButton
            variantSize="small"
            onClick={() => setShowDelete(true)}
          />
        </Row>
      )}
      {showUpdate && (
        <UpdatePositionModal
          guildId={guildId}
          presetId={presetId}
          position={position}
          onClose={() => setShowUpdate(false)}
        />
      )}
      {showDelete && (
        <DeletePositionModal
          guildId={guildId}
          presetId={presetId}
          positionId={position.positionId}
          onClose={() => setShowDelete(false)}
        />
      )}
    </Card>
  );
}
