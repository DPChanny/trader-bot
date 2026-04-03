import { useState } from "preact/hooks";
import {
  useAddPosition,
  useDeletePosition,
  useUpdatePosition,
} from "@/hooks/position";
import { Error } from "@/components/commons/error";
import { ConfirmModal } from "@/components/commons/modal";
import { Section } from "@/components/commons/section";
import { AddPositionModal } from "./addPositionModal";
import { PositionCard } from "./positionCard";

import styles from "@/styles/pages/preset/positionList.module.css";

interface PositionListProps {
  guildId: number;
  presetId: number;
  positions: any[];
  showPositionForm: boolean;
  newPositionName: string;
  newPositionIconUrl: string;
  onShowPositionFormChange: (show: boolean) => void;
  onNewPositionNameChange: (name: string) => void;
  onNewPositionIconUrlChange: (url: string) => void;
}

export function PositionList({
  guildId,
  presetId,
  positions,
  showPositionForm,
  newPositionName,
  newPositionIconUrl,
  onShowPositionFormChange,
  onNewPositionNameChange,
  onNewPositionIconUrlChange,
}: PositionListProps) {
  const [editingPositionId, setEditingPositionId] = useState<number | null>(
    null,
  );
  const [editingName, setEditingName] = useState("");
  const [editingIconUrl, setEditingIconUrl] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const addPosition = useAddPosition();
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();

  const handleAddPosition = async () => {
    if (!newPositionName.trim()) return;
    try {
      await addPosition.mutateAsync({
        guildId,
        presetId: presetId,
        dto: {
          name: newPositionName.trim(),
          iconUrl: newPositionIconUrl.trim() || undefined,
        },
      });
      onNewPositionNameChange("");
      onNewPositionIconUrlChange("");
      onShowPositionFormChange(false);
    } catch (err) {
      console.error("Failed to add position:", err);
    }
  };

  const handleUpdatePosition = async (positionId: number) => {
    if (!editingName.trim()) return;
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
    if (deleteTargetId === null) return;
    try {
      await deletePosition.mutateAsync({
        guildId,
        presetId: presetId,
        positionId: deleteTargetId,
      });
      setShowDeleteConfirm(false);
      setDeleteTargetId(null);
    } catch (err) {
      console.error("Failed to delete position:", err);
      setShowDeleteConfirm(false);
    }
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await handleAddPosition();
  };

  return (
    <Section variantTone="ghost" variantIntent="secondary">
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
        onClose={() => onShowPositionFormChange(false)}
        onSubmit={handleSubmit}
        positionName={newPositionName}
        positionIconUrl={newPositionIconUrl}
        onNameChange={onNewPositionNameChange}
        onIconUrlChange={onNewPositionIconUrlChange}
        isPending={addPosition.isPending}
        error={addPosition.error}
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
