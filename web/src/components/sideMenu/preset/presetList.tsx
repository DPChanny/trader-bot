import { useState } from "preact/hooks";
import { Section } from "@/components/commons/section";
import { Bar } from "@/components/commons/bar";
import { PrimaryButton } from "@/components/commons/button";
import { CreatePresetModal } from "./createPresetModal";
import { PresetCard } from "./presetCard";
import { useCreatePreset, usePresets } from "@/hooks/preset";
import { Role } from "@/dtos/memberDto";
import { useVerifyRole } from "@/hooks/member";
import styles from "@/styles/components/sideMenu/preset/presetList.module.css";

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

  const handleCreatePreset = async (input: {
    name: string;
    points: number;
    timer: number;
    teamSize: number;
    pointScale: number;
  }) => {
    await createPreset.mutateAsync({ guildId, dto: input });
  };

  return (
    <>
      <Section variantIntent="secondary" className={styles.wrapper}>
        <Section variantTone="ghost" variantLayout="row">
          <h3>프리셋 관리</h3>
          {canEdit && (
            <PrimaryButton onClick={handleOpenCreatePresetModal}>
              추가
            </PrimaryButton>
          )}
        </Section>
        <Bar />
        <Section variantTone="ghost" variantIntent="tertiary">
          {presets.map((preset) => (
            <PresetCard
              key={preset.presetId}
              preset={preset}
              guildId={guildId}
              isActive={selectedPresetId === preset.presetId}
            />
          ))}
        </Section>
      </Section>

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
