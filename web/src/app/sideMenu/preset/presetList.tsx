import { useState } from "preact/hooks";
import { Row, Scroll } from "@components/atoms/layout";
import {
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { PrimaryButton } from "@components/atoms/button";
import { CreatePresetModal } from "./createPresetModal";
import { PresetCard } from "./presetCard";
import { usePresets } from "@hooks/preset";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { Title } from "@components/atoms/text";

interface PresetListProps {
  guildId: string;
  selectedPresetId: number | null;
}

export function PresetList({ guildId, selectedPresetId }: PresetListProps) {
  const [showCreate, setShowCreate] = useState(false);

  const presets = usePresets(guildId);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);

  return (
    <>
      <SecondarySection fill minSize>
        <Row justify="between" align="center">
          <Title>프리셋 관리</Title>
          {canEdit && (
            <PrimaryButton onClick={() => setShowCreate(true)}>
              추가
            </PrimaryButton>
          )}
        </Row>
        <TertiarySection fill>
          <Scroll axis="y">
            {(presets.data ?? []).map((preset) => (
              <PresetCard
                key={preset.presetId}
                preset={preset}
                guildId={guildId}
                isSelected={selectedPresetId === preset.presetId}
              />
            ))}
          </Scroll>
        </TertiarySection>
      </SecondarySection>

      {showCreate && (
        <CreatePresetModal
          guildId={guildId}
          onClose={() => setShowCreate(false)}
        />
      )}
    </>
  );
}
