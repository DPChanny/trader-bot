import { useState } from "preact/hooks";
import { Loading } from "@/components/commons/loading";
import { PresetCard } from "./presetCard";
import styles from "@/styles/pages/preset/presetList.module.css";
import { Section } from "@/components/commons/section";
import { useDeletePreset, useUpdatePreset } from "@/hooks/preset";
import { useAddAuction } from "@/hooks/auction";
import { ConfirmModal } from "@/components/commons/modal";
import { EditPresetModal } from "./editPresetModal";
import { PrimaryButton } from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import { Error } from "@/components/commons/error";
import { useGuildContext } from "@/contexts/guildContext";
import { usePresetPageContext } from "./presetContext";
import type { PresetDTO } from "@/dtos/presetDto";
import type { PresetMemberDetailDTO } from "@/dtos/presetMemberDto";

interface PresetListProps {
  presets: PresetDTO[];
  presetMembers: PresetMemberDetailDTO[] | undefined;
  isLoading: boolean;
}

export function PresetList({
  presets,
  presetMembers,
  isLoading,
}: PresetListProps) {
  const { guild } = useGuildContext();
  const guildId = guild?.discordId ?? null;
  const { selectedPresetId, setSelectedPresetId, openCreatePreset } =
    usePresetPageContext();

  const [isEditing, setIsEditing] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<number | null>(null);

  const updatePreset = useUpdatePreset();
  const deletePreset = useDeletePreset();
  const addAuction = useAddAuction();

  const handleEdit = (presetId: number) => {
    setEditingPresetId(presetId);
    setIsEditing(true);
  };

  const handleUpdate = async (
    name: string,
    points: number,
    timer: number,
    teamSize: number,
    pointScale: number,
  ) => {
    if (!editingPresetId || !name.trim() || !guildId) return;
    try {
      await updatePreset.mutateAsync({
        guildId,
        presetId: editingPresetId,
        dto: {
          name: name.trim(),
          points,
          timer,
          teamSize,
          pointScale,
        },
      });
      setIsEditing(false);
      setEditingPresetId(null);
    } catch (err) {
      console.error("Failed to update preset:", err);
    }
  };

  const handleDeleteClick = (presetId: number) => {
    setDeletingPresetId(presetId);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingPresetId || !guildId) return;
    try {
      await deletePreset.mutateAsync({ guildId, presetId: deletingPresetId });
      setShowDeleteConfirm(false);
      if (selectedPresetId === deletingPresetId) {
        setSelectedPresetId(null);
      }
      setDeletingPresetId(null);
    } catch (err) {
      console.error("Failed to delete preset:", err);
      setShowDeleteConfirm(false);
    }
  };

  const handleStartAuction = async () => {
    if (!selectedPresetId || !presetMembers) return;
    const leaderCount = presetMembers.filter((pm) => pm.isLeader).length || 0;
    if (leaderCount < 2) return;
    try {
      await addAuction.mutateAsync(selectedPresetId);
    } catch (err) {
      console.error("Failed to start auction:", err);
    }
  };

  const leaderCount = presetMembers?.filter((pm) => pm.isLeader).length || 0;
  const memberCount = presetMembers?.length || 0;
  const requiredMembers = leaderCount * 5;
  const canStartAuction = leaderCount >= 2;

  let presetValidMessage = "";
  if (selectedPresetId && presetMembers) {
    if (leaderCount < 2) {
      presetValidMessage = `현재 팀장 인원(${leaderCount}명)이 최소 인원(2명)보다 적습니다.`;
    } else if (memberCount < requiredMembers) {
      presetValidMessage = `현재 인원(${memberCount}명)이 권장 인원(${requiredMembers}명)보다 적습니다.`;
    }
  }

  return (
    <Section variantTone="ghost" className={styles.contentSection}>
      <Section
        variantTone="ghost"
        variantLayout="row"
        variantIntent="secondary"
      >
        <h3>프리셋 목록</h3>
        <PrimaryButton onClick={openCreatePreset}>추가</PrimaryButton>
      </Section>
      <Bar />

      {isLoading ? (
        <Loading />
      ) : (
        <Section
          variantTone="ghost"
          variantIntent="secondary"
          className={styles.cardList}
        >
          {presets?.map((preset) => (
            <PresetCard
              key={preset.presetId}
              preset={preset}
              isActive={selectedPresetId === preset.presetId}
              onSelect={setSelectedPresetId}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </Section>
      )}

      <Bar />
      <Section variantTone="ghost" variantIntent="secondary">
        <PrimaryButton
          onClick={handleStartAuction}
          disabled={
            addAuction.isPending ||
            !canStartAuction ||
            !selectedPresetId ||
            !presetMembers
          }
        >
          {addAuction.isPending ? "경매 생성 중" : "경매 생성"}
        </PrimaryButton>
        {presetValidMessage && <Error>{presetValidMessage}</Error>}
        {addAuction.isError && (
          <Error detail={addAuction.error?.message}>
            경매를 시작하는데 실패했습니다.
          </Error>
        )}
      </Section>

      <EditPresetModal
        isOpen={isEditing}
        onClose={() => {
          setIsEditing(false);
          setEditingPresetId(null);
        }}
        onSubmit={handleUpdate}
        presetId={editingPresetId}
        name={presets?.find((p) => p.presetId === editingPresetId)?.name || ""}
        points={
          presets?.find((p) => p.presetId === editingPresetId)?.points || 1000
        }
        timer={
          presets?.find((p) => p.presetId === editingPresetId)?.timer || 30
        }
        teamSize={
          presets?.find((p) => p.presetId === editingPresetId)?.teamSize || 5
        }
        pointScale={
          presets?.find((p) => p.presetId === editingPresetId)?.pointScale || 1
        }
        isPending={updatePreset.isPending}
        error={updatePreset.error}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingPresetId(null);
        }}
        onConfirm={handleDelete}
        title="프리셋 삭제"
        message="정말 이 프리셋을 삭제하시겠습니까?"
        confirmText="삭제"
        isPending={deletePreset.isPending}
      />
    </Section>
  );
}
