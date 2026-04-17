import { useState } from "preact/hooks";
import { useGuildId } from "@hooks/router";
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
};

export function PositionCard({ position }: PositionCardProps) {
  const guildId = useGuildId();
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
  const canDelete = useVerifyRole(guildId, Role.ADMIN);
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
        <UpdatePositionModal
          position={position}
          onClose={() => setShowUpdate(false)}
        />
      )}
      {showDelete && (
        <DeletePositionModal
          positionId={position.positionId}
          onClose={() => setShowDelete(false)}
        />
      )}
    </Card>
  );
}
