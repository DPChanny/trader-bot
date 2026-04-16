import { useState } from "preact/hooks";
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

interface PositionEditorProps {
  guildId: string;
  presetId: number;
}

export function PositionEditor({ guildId, presetId }: PositionEditorProps) {
  const [showAdd, setShowAdd] = useState(false);

  const positions = usePositions(guildId, presetId);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);

  return (
    <SecondarySection fill minSize>
      <Row justify="between" align="center">
        <Title>포지션 목록</Title>
        {canEdit && (
          <PrimaryButton onClick={() => setShowAdd(true)}>추가</PrimaryButton>
        )}
      </Row>
      <TertiarySection fill>
        <Scroll axis="y">
          {positions.error ? (
            <Error error={positions.error}>
              포지션 목록을 불러오지 못했습니다.
            </Error>
          ) : positions.isLoading ? (
            <Loading />
          ) : (
            positions.data?.map((position) => (
              <PositionCard
                key={position.positionId}
                position={position}
                guildId={guildId}
                presetId={presetId}
              />
            ))
          )}
        </Scroll>
      </TertiarySection>

      {showAdd && (
        <AddPositionModal
          guildId={guildId}
          presetId={presetId}
          onClose={() => setShowAdd(false)}
        />
      )}
    </SecondarySection>
  );
}
