import { useState } from "preact/hooks";
import { route } from "preact-router";
import { Section } from "@/components/commons/section";
import { Bar } from "@/components/commons/bar";
import { PrimaryButton } from "@/components/commons/button";
import { ConfirmModal } from "@/components/commons/modal";
import { EditPresetModal } from "./editPresetModal";
import { AddPresetModal } from "./addPresetModal";
import { PresetCard } from "./presetCard";
import { usePresets, useDeletePreset, useUpdatePreset } from "@/hooks/preset";
import styles from "@/styles/components/sidebar/preset/presetList.module.css";
import type { PresetDTO } from "@/dtos/presetDto";

interface PresetListProps {
  guildId: string;
  selectedPresetId: number | null;
}

export function PresetList({ guildId, selectedPresetId }: PresetListProps) {
  const [editingPreset, setEditingPreset] = useState<PresetDTO | null>(null);
  const [deletingPresetId, setDeletingPresetId] = useState<number | null>(null);
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);

  const { data: presets = [] } = usePresets(guildId);
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();

  const handleSelectPreset = (presetId: number) => {
    route(`/guild/${guildId}/preset/${presetId}`);
  };

  const handleUpdate = async (
    name: string,
    points: number,
    timer: number,
    teamSize: number,
    pointScale: number,
  ) => {
    if (!editingPreset) return;
    try {
      await updatePreset.mutateAsync({
        guildId,
        presetId: editingPreset.presetId,
        dto: { name: name.trim(), points, timer, teamSize, pointScale },
      });
      setEditingPreset(null);
    } catch {}
  };

  const handleDelete = async () => {
    if (!deletingPresetId) return;
    try {
      await deletePreset.mutateAsync({ guildId, presetId: deletingPresetId });
      if (selectedPresetId === deletingPresetId) route(`/guild/${guildId}`);
    } catch {
    } finally {
      setDeletingPresetId(null);
    }
  };

  return (
    <>
      <Section variantTone="ghost" variantIntent="secondary">
        <Section variantTone="ghost" variantLayout="row">
          <h3 className={styles.title}>프리셋</h3>
          <PrimaryButton
            variantSize="small"
            variantTone="outline"
            onClick={() => setIsCreatingPreset(true)}
            title="프리셋 추가"
          >
            +
          </PrimaryButton>
        </Section>
        <Bar />
        <Section
          variantTone="ghost"
          variantLayout="column"
          className={styles.list}
        >
          {presets.map((preset) => (
            <PresetCard
              key={preset.presetId}
              preset={preset}
              isActive={selectedPresetId === preset.presetId}
              onClick={() => handleSelectPreset(preset.presetId)}
              onEdit={() => setEditingPreset(preset)}
              onDelete={() => setDeletingPresetId(preset.presetId)}
            />
          ))}
        </Section>
      </Section>

      {editingPreset && (
        <EditPresetModal
          isOpen={true}
          onClose={() => setEditingPreset(null)}
          onSubmit={handleUpdate}
          presetId={editingPreset.presetId}
          name={editingPreset.name}
          points={editingPreset.points}
          timer={editingPreset.timer}
          teamSize={editingPreset.teamSize}
          pointScale={editingPreset.pointScale}
          isPending={updatePreset.isPending}
          error={updatePreset.error}
        />
      )}

      <ConfirmModal
        isOpen={!!deletingPresetId}
        onClose={() => setDeletingPresetId(null)}
        onConfirm={handleDelete}
        title="프리셋 삭제"
        message="정말 이 프리셋을 삭제하시겠습니까?"
        confirmText="삭제"
        isPending={deletePreset.isPending}
      />

      <AddPresetModal
        guildId={guildId}
        isOpen={isCreatingPreset}
        onClose={() => setIsCreatingPreset(false)}
      />
    </>
  );
}
