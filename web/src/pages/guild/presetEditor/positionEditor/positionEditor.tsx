import { useState } from "preact/hooks";
import { useDeletePosition, useUpdatePosition } from "@/hooks/position";
import { Error } from "@/components/commons/error";
import { PrimaryButton } from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import { ConfirmModal } from "@/components/commons/modal";
import { Section } from "@/components/commons/section";
import { AddPositionModal } from "./addPositionModal";
import { EditPositionModal } from "./editPositionModal";
import { PositionCard } from "./positionCard";
import type { PositionDTO } from "@/dtos/positionDto";

import styles from "@/styles/pages/guild/presetEditor/positionEditor/positionList.module.css";

interface PositionEditorProps {
  guildId: string;
  presetId: number;
  positions: any[];
}

export function PositionEditor({
  guildId,
  presetId,
  positions,
}: PositionEditorProps) {
  const [showPositionForm, setShowPositionForm] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionDTO | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();

  const handleUpdatePosition = async (name: string, iconUrl: string | null) => {
    if (!editingPosition || !guildId || !presetId) return;
    try {
      await updatePosition.mutateAsync({
        guildId,
        presetId,
        positionId: editingPosition.positionId,
        dto: { name, iconUrl },
      });
      setEditingPosition(null);
      updatePosition.reset();
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
      {deletePosition.isError && (
        <Error detail={deletePosition.error?.message}>
          포지션 작업 중 오류가 발생했습니다.
        </Error>
      )}

      <Section
        variantTone="ghost"
        variantLayout="column"
        variantIntent="secondary"
        className={styles.positionList}
      >
        {positions?.map((position) => (
          <PositionCard
            key={position.positionId}
            position={position}
            onEdit={() => setEditingPosition(position)}
            onDelete={() => {
              setDeleteTargetId(position.positionId);
              setShowDeleteConfirm(true);
            }}
            isDeletePending={deletePosition.isPending}
          />
        ))}
      </Section>

      <AddPositionModal
        guildId={guildId}
        presetId={presetId}
        isOpen={showPositionForm}
        onClose={() => setShowPositionForm(false)}
      />

      <EditPositionModal
        position={editingPosition}
        onClose={() => {
          setEditingPosition(null);
          updatePosition.reset();
        }}
        onSubmit={handleUpdatePosition}
        isPending={updatePosition.isPending}
        error={updatePosition.isError ? updatePosition.error : undefined}
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
