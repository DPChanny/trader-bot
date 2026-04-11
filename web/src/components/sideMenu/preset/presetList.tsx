import { useState } from "preact/hooks";
import { route } from "preact-router";
import { Section } from "@/components/commons/section";
import { Bar } from "@/components/commons/bar";
import { PrimaryButton } from "@/components/commons/button";
import { AddPresetModal } from "./addPresetModal";
import { PresetCard } from "./presetCard";
import { usePresets } from "@/hooks/preset";

interface PresetListProps {
  guildId: string;
  selectedPresetId: number | null;
}

export function PresetList({ guildId, selectedPresetId }: PresetListProps) {
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);

  const { data: presets = [] } = usePresets(guildId);

  const handleSelectPreset = (presetId: number) => {
    route(`/guild/${guildId}/preset/${presetId}`);
  };

  return (
    <>
      <Section variantTone="ghost" variantIntent="secondary">
        <Section variantTone="ghost" variantLayout="row">
          <h3>프리셋 관리</h3>
          <PrimaryButton onClick={() => setIsCreatingPreset(true)}>
            추가
          </PrimaryButton>
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

      <AddPresetModal
        guildId={guildId}
        isOpen={isCreatingPreset}
        onClose={() => setIsCreatingPreset(false)}
      />
    </>
  );
}
