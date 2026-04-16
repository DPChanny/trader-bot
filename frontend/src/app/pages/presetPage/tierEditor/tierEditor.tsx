import { useState } from "preact/hooks";
import { useGuildId, usePresetId } from "@hooks/router";
import { useTiers } from "@hooks/tier";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { PrimaryButton } from "@components/atoms/button";
import { Row, Scroll } from "@components/atoms/layout";
import { AddTierModal } from "./addTierModal";
import { TierCard } from "./tierCard";
import {
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { Title } from "@components/atoms/text";

export function TierEditor() {
  const guildId = useGuildId();
  const presetId = usePresetId();
  const [showAdd, setShowAdd] = useState(false);

  const tiers = useTiers(guildId, presetId);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);

  return (
    <SecondarySection fill minSize>
      <Row justify="between" align="center">
        <Title>티어 목록</Title>
        {canEdit && (
          <PrimaryButton onClick={() => setShowAdd(true)}>추가</PrimaryButton>
        )}
      </Row>
      <TertiarySection fill>
        <Scroll axis="y">
          {tiers.error ? (
            <Error error={tiers.error}>티어 목록을 불러오지 못했습니다</Error>
          ) : tiers.isLoading ? (
            <Loading />
          ) : (
            tiers.data?.map((tier) => (
              <TierCard key={tier.tierId} tier={tier} />
            ))
          )}
        </Scroll>
      </TertiarySection>

      {showAdd && <AddTierModal onClose={() => setShowAdd(false)} />}
    </SecondarySection>
  );
}
