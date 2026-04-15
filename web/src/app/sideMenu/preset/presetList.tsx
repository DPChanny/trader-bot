import { useState } from "preact/hooks";
import { Row, Scroll } from "@components/atoms/layout";
import { SecondarySection } from "@components/molecules/section";
import { PrimaryButton } from "@components/atoms/button";
import { CreatePresetModal } from "./createPresetModal";
import { PresetCard } from "./presetCard";
import { useCreatePreset, usePresets } from "@hooks/preset";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import type { CreatePresetDTO } from "@dtos/preset";
import { Bar } from "@components/atoms/bar";

interface PresetListProps {
  guildId: string;
  selectedPresetId: number | null;
}

export function PresetList({ guildId, selectedPresetId }: PresetListProps) {
  const [showCreatePresetModal, setShowCreatePresetModal] = useState(false);

  const { data: presets = [] } = usePresets(guildId);
  const createPreset = useCreatePreset();
  const canEdit = useVerifyRole(guildId, Role.EDITOR);

  const handleOpenCreatePresetModal = () => {
    setShowCreatePresetModal(true);
  };

  const handleCloseCreatePresetModal = () => {
    setShowCreatePresetModal(false);
    createPreset.reset();
  };

  const handleCreatePreset = async (dto: CreatePresetDTO) => {
    await createPreset.mutateAsync({ guildId, dto });
  };

  return (
    <>
      <SecondarySection fill minSize>
        <Row justify="between" align="center">
          <h3>프리셋 관리</h3>
          {canEdit && (
            <PrimaryButton onClick={handleOpenCreatePresetModal}>
              추가
            </PrimaryButton>
          )}
        </Row>
        <Bar />
        <Scroll axis="y" gap="xs">
          {presets.map((preset) => (
            <PresetCard
              key={preset.presetId}
              preset={preset}
              guildId={guildId}
              isSelected={selectedPresetId === preset.presetId}
            />
          ))}
        </Scroll>
      </SecondarySection>

      {showCreatePresetModal && (
        <CreatePresetModal
          onClose={handleCloseCreatePresetModal}
          onSubmit={handleCreatePreset}
          isPending={createPreset.isPending}
          error={createPreset.isError ? createPreset.error : undefined}
        />
      )}
    </>
  );
}
