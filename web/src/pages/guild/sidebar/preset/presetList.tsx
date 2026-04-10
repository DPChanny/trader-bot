import { useState } from "preact/hooks";
import { route } from "preact-router";
import { Section } from "@/components/commons/section";
import { PrimaryButton } from "@/components/commons/button";
import { ConfirmModal } from "@/components/commons/modal";
import { EditPresetModal } from "./editPresetModal";
import { AddPresetModal } from "./addPresetModal";
import { PresetCard } from "./presetCard";
import { usePresets, useDeletePreset, useUpdatePreset } from "@/hooks/preset";
import styles from "@/styles/components/sidebar/presetList.module.css";
import type { PresetDTO } from "@/dtos/presetDto";

interface SidebarPresetListProps {
  guildId: string;
  selectedPresetId: number | null;
  editor: "preset" | "member";
}

export function SidebarPresetList({
  guildId,
  selectedPresetId,
  editor,
}: SidebarPresetListProps) {
  const [open, setOpen] = useState(true);
  const [editingPreset, setEditingPreset] = useState<PresetDTO | null>(null);
  const [deletingPresetId, setDeletingPresetId] = useState<number | null>(null);
  const [isCreatingPreset, setIsCreatingPreset] = useState(false);

  const { data: presets = [] } = usePresets(guildId);
  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();

  const handleSelectPreset = (presetId: number) => {
    route(`/guild/${guildId}/preset/${presetId}`);
  };

  const handleAddPreset = () => {
    if (editor !== "preset") route(`/guild/${guildId}/preset`);
    setIsCreatingPreset(true);
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
      if (selectedPresetId === deletingPresetId)
        route(`/guild/${guildId}/preset`);
    } catch {
    } finally {
      setDeletingPresetId(null);
    }
  };

  return (
    <>
      <Section
        variantTone="ghost"
        variantLayout="column"
        className={styles.presetListSection}
      >
        <Section
          variantTone="ghost"
          variantLayout="row"
          className={styles.presetHeader}
        >
          <button
            type="button"
            className={styles.presetToggle}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            <span className={`${styles.arrow} ${open ? styles.arrowOpen : ""}`}>
              ▶
            </span>
            <span
              className={`${styles.presetLabel} ${
                editor === "preset" ? styles.presetLabelActive : ""
              }`}
              onClick={(e) => {
                e.stopPropagation();
                route(`/guild/${guildId}/preset`);
              }}
            >
              프리셋
            </span>
          </button>
          <PrimaryButton
            variantSize="small"
            variantTone="outline"
            onClick={handleAddPreset}
            title="프리셋 추가"
            className={styles.addBtn}
          >
            +
          </PrimaryButton>
        </Section>

        {open && (
          <Section
            variantTone="ghost"
            variantLayout="column"
            className={styles.presetItems}
          >
            {presets.map((preset) => (
              <PresetCard
                key={preset.presetId}
                preset={preset}
                isActive={
                  selectedPresetId === preset.presetId && editor === "preset"
                }
                onClick={() => handleSelectPreset(preset.presetId)}
                onEdit={() => setEditingPreset(preset)}
                onDelete={() => setDeletingPresetId(preset.presetId)}
              />
            ))}
          </Section>
        )}
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
