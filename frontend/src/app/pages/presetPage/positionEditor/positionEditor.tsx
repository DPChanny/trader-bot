import { useState } from "preact/hooks";
import { useGuildId, usePresetId } from "@hooks/router";
import { usePositions } from "@hooks/position";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { PrimaryButton } from "@components/atoms/button";
import { Row, Scroll } from "@components/atoms/layout";
import {
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { Title } from "@components/atoms/text";
import { AddPositionModal } from "./addPositionModal";
import { PositionCard } from "./positionCard";

export function PositionEditor() {
  const guildId = useGuildId();
  const presetId = usePresetId();
  const [showAdd, setShowAdd] = useState(false);

  const positions = usePositions(guildId, presetId);
  const canCreate = useVerifyRole(guildId, Role.ADMIN);

  return (
    <SecondarySection fill minSize>
      <Row justify="between" align="center">
        <Title>포지션 목록</Title>
        {canCreate && (
          <PrimaryButton onClick={() => setShowAdd(true)}>추가</PrimaryButton>
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
