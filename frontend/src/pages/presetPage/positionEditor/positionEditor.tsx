import { useParams } from "@tanstack/react-router";
import { useState } from "react";

import { usePositions } from "@features/position/hook";
import { Role } from "@features/member/dto";
import { useVerifyRole } from "@features/member/hook";
import { Plan } from "@features/subscription/dto";
import { useVerifyPlan } from "@features/subscription/hook";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { PrimaryButton } from "@components/atoms/button";
import { Row, Scroll } from "@components/atoms/layout";
import {
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Title } from "@components/atoms/text";
import { AddPositionModal } from "./addPositionModal";
import { PositionCard } from "./positionCard";

export function PositionEditor() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const { presetId: presetIdStr } = useParams({ strict: false }) as {
    presetId: string;
  };
  const presetId = parseInt(presetIdStr, 10);
  const [showAdd, setShowAdd] = useState(false);

  const positions = usePositions(guildId, presetId);
  const canCreate = useVerifyRole(guildId, Role.ADMIN);
  const hasPlan = useVerifyPlan(guildId, Plan.PLUS);

  return (
    <SecondarySection fill minSize>
      <Row justify="between" align="center">
        <Title>포지션 목록</Title>
        {canCreate && (
          <PrimaryButton disabled={!hasPlan} onClick={() => setShowAdd(true)}>
            추가
          </PrimaryButton>
        )}
      </Row>
      <TertiarySection fill minSize>
        <Scroll axis="y">
          {positions.error ? (
            <Error error={positions.error}>
              포지션 목록을 불러오지 못했습니다
            </Error>
          ) : positions.isLoading ? (
            <Loading />
          ) : (
            positions.data?.map((position) => (
              <PositionCard key={position.positionId} position={position} />
            ))
          )}
        </Scroll>
      </TertiarySection>

      {showAdd && <AddPositionModal onClose={() => setShowAdd(false)} />}
    </SecondarySection>
  );
}
