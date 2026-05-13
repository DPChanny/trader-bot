import { useParams } from "@tanstack/react-router";
import { useState } from "react";

import { DeleteButton, EditButton } from "@components/atoms/button";
import { Badge } from "@components/atoms/badge";
import { Card } from "@components/surfaces/card";
import { Image } from "@components/atoms/image";
import { Row } from "@components/atoms/layout";
import { Name } from "@components/atoms/text";
import type { PositionDTO } from "@features/position/dto";
import { Role } from "@features/member/dto";
import { useVerifyRole } from "@features/member/hook";
import { Plan } from "@features/subscription/dto";
import { useVerifyPlan } from "@features/subscription/hook";
import { UpdatePositionModal } from "./updatePositionModal";
import { DeletePositionModal } from "./deletePositionModal";

type PositionCardProps = {
  position: PositionDTO;
};

export function PositionCard({ position }: PositionCardProps) {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const [showUpdate, setShowUpdate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);
  const canDelete = useVerifyRole(guildId, Role.ADMIN);
  const hasPlan = useVerifyPlan(guildId, Plan.PLUS);
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
          position.name
        )}
      </Badge>
      <Name>{position.name}</Name>
      {(canEdit || canDelete) && (
        <Row align="center">
          {canEdit && (
            <EditButton
              variantSize="small"
              disabled={!hasPlan}
              onClick={() => setShowUpdate(true)}
            />
          )}
          {canDelete && (
            <DeleteButton
              variantSize="small"
              disabled={!hasPlan}
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
