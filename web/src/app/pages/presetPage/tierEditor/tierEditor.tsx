import { useState } from "preact/hooks";
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

interface TierEditorProps {
  guildId: string;
  presetId: number;
}

export function TierEditor({ guildId, presetId }: TierEditorProps) {
  const [showAdd, setShowAdd] = useState(false);

  const { data: tiers, isLoading, error } = useTiers(guildId, presetId);
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
          {error ? (
            <Error error={error} />
          ) : isLoading ? (
            <Loading />
          ) : (
            tiers?.map((tier) => (
              <TierCard
                key={tier.tierId}
                tier={tier}
                guildId={guildId}
                presetId={presetId}
              />
            ))
          )}
        </Scroll>
      </TertiarySection>

      {showAdd && (
        <AddTierModal
          guildId={guildId}
          presetId={presetId}
          onClose={() => setShowAdd(false)}
        />
      )}
    </SecondarySection>
  );
}
