import { useState } from "preact/hooks";
import { useDeletePosition, useUpdatePosition } from "@/hooks/position";
import { useGuildContext } from "@/contexts/guildContext";
import { usePresetPageContext } from "./presetContext";
import { Error } from "@/components/commons/error";
import { PrimaryButton } from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import { ConfirmModal } from "@/components/commons/modal";
import { Section } from "@/components/commons/section";
import { AddPositionModal } from "./addPositionModal";
import { PositionCard } from "./positionCard";

import styles from "@/styles/pages/preset/positionList.module.css";

interface PositionListProps {
  positions: any[];
}

export function PositionList({ positions }: PositionListProps) {
  const { guildId } = useGuildContext();
  const { selectedPresetId: presetId } = usePresetPageContext();

  const [showPositionForm, setShowPositionForm] = useState(false);
  const [editingPositionId, setEditingPositionId] = useState<number | null>(
    null,
  );
  const [editingName, setEditingName] = useState("");
  const [editingIconUrl, setEditingIconUrl] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();

  const handleUpdatePosition = async (positionId: number) => {
    if (!editingName.trim() || !guildId || !presetId) return;
    try {
      await updatePosition.mutateAsync({
        guildId,
        presetId,
        positionId,
        dto: {
          name: editingName.trim(),
          iconUrl: editingIconUrl.trim() === "" ? null : editingIconUrl.trim(),
        },
      });
      setEditingPositionId(null);
      setEditingName("");
      setEditingIconUrl("");
    } catch (err) {
      console.error("Failed to update position:", err);
    }
  };

  const handleDeletePosition = async () => {
    if (deleteTargetId === null || !guildId || !presetId) return;
    try {
      await deletePosition.mutateAsync({
        guildId,
        presetId,
        positionId: deleteTargetId,
      });
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete position:", err);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Section variantTone="ghost" variantIntent="secondary">
      <Section variantTone="ghost" variantLayout="row">
        <h3>포지션 목록</h3>
        <PrimaryButton onClick={() => setShowPositionForm(true)}>
          추가
        </PrimaryButton>
      </Section>
      <Bar />
      {(updatePosition.isError || deletePosition.isError) && (
        <Error detail={(updatePosition.error || deletePosition.error)?.message}>
          포지션 작업 중 오류가 발생했습니다.
        </Error>
      )}

      <Section
        variantTone="ghost"
        variantLayout="row"
        variantIntent="secondary"
        className={styles.positionList}
      >
        {positions?.map((position) => (
          <PositionCard
            key={position.positionId}
            position={position}
            isEditing={editingPositionId === position.positionId}
            editingName={editingName}
            editingIconUrl={editingIconUrl}
            onEditingNameChange={setEditingName}
            onEditingIconUrlChange={setEditingIconUrl}
            onEdit={() => {
              setEditingPositionId(position.positionId);
              setEditingName(position.name);
              setEditingIconUrl(position.iconUrl || "");
            }}
            onSave={() => handleUpdatePosition(position.positionId)}
            onCancelEdit={() => {
              setEditingPositionId(null);
              setEditingName("");
              setEditingIconUrl("");
            }}
            onDelete={() => {
              setDeleteTargetId(position.positionId);
              setShowDeleteConfirm(true);
            }}
            isUpdatePending={updatePosition.isPending}
            isDeletePending={deletePosition.isPending}
          />
        ))}
      </Section>

      <AddPositionModal
        isOpen={showPositionForm}
        onClose={() => setShowPositionForm(false)}
      />

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTargetId(null);
        }}
        onConfirm={handleDeletePosition}
        title="포지션 삭제"
        message="정말 이 포지션을 삭제하시겠습니까?"
        confirmText="삭제"
        isPending={deletePosition.isPending}
      />
    </Section>
  );
}
