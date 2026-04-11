import { useState } from "preact/hooks";
import { route } from "preact-router";
import { Section } from "@/components/commons/section";
import { Bar } from "@/components/commons/bar";
import { PrimaryButton } from "@/components/commons/button";
import { AddPresetModal } from "./addPresetModal";
import { PresetCard } from "./presetCard";
import { useAddPreset, usePresets } from "@/hooks/preset";

interface PresetListProps {
  guildId: string;
  selectedPresetId: number | null;
}

export function PresetList({ guildId, selectedPresetId }: PresetListProps) {
  const [showAddPresetModal, setShowAddPresetModal] = useState(false);

  const { data: presets = [] } = usePresets(guildId);
  const addPreset = useAddPreset();

  const handleSelectPreset = (presetId: number) => {
    route(`/guild/${guildId}/preset/${presetId}`);
  };

  const handleOpenAddPresetModal = () => {
    setShowAddPresetModal(true);
  };

  const handleCloseAddPresetModal = () => {
    setShowAddPresetModal(false);
    addPreset.reset();
  };

  const handleAddPreset = async (input: {
    name: string;
    points: number;
    timer: number;
    teamSize: number;
    pointScale: number;
  }) => {
    await addPreset.mutateAsync({ guildId, dto: input });
  };

  return (
    <>
      <Section variantTone="ghost" variantIntent="secondary">
        <Section variantTone="ghost" variantLayout="row">
          <h3>프리셋 관리</h3>
          <PrimaryButton onClick={handleOpenAddPresetModal}>추가</PrimaryButton>
        </Section>
        <Bar />
        <Section
          variantTone="ghost"
          variantLayout="column"
          variantIntent="secondary"
        >
          {presets.map((preset) => (
            <PresetCard
              key={preset.presetId}
              preset={preset}
              isActive={selectedPresetId === preset.presetId}
              onClick={() => handleSelectPreset(preset.presetId)}
            />
          ))}
        </Section>
      </Section>

      {showAddPresetModal && (
        <AddPresetModal
          onClose={handleCloseAddPresetModal}
          onSubmit={handleAddPreset}
          isPending={addPreset.isPending}
          error={addPreset.isError ? addPreset.error : undefined}
        />
      )}
    </>
  );
}
