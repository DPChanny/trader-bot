import { useState } from "preact/hooks";
import {
  useAddPosition,
  useDeletePosition,
  usePositions,
  useUpdatePosition,
} from "@/hooks/position";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { PrimaryButton } from "@/components/commons/button";
import { Bar } from "@/components/commons/bar";
import { Section } from "@/components/commons/section";
import { AddPositionModal } from "./addPositionModal";
import { EditPositionModal } from "./editPositionModal";
import { DeletePositionModal } from "./deletePositionModal";
import { PositionCard } from "./positionCard";
import type { PositionDTO } from "@/dtos/positionDto";

import styles from "@/styles/pages/guild/presetEditor/positionEditor/positionList.module.css";

interface PositionEditorProps {
  guildId: string;
  presetId: number;
}

export function PositionEditor({ guildId, presetId }: PositionEditorProps) {
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<PositionDTO | null>(
    null,
  );
  const [showDeletePositionModal, setShowDeletePositionModal] = useState(false);
  const [deletingPositionId, setDeletingPositionId] = useState<number | null>(
    null,
  );

  const { data: positions, isLoading, error } = usePositions(guildId, presetId);
  const addPosition = useAddPosition();
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();

  const handleOpenAddPositionModal = () => {
    setShowAddPositionModal(true);
  };

  const handleCloseAddPositionModal = () => {
    setShowAddPositionModal(false);
    addPosition.reset();
  };

  const handleAddPosition = async (input: {
    name: string;
    iconUrl: string | null;
  }) => {
    await addPosition.mutateAsync({ guildId, presetId, dto: input });
  };

  const handleUpdatePosition = async (name: string, iconUrl: string | null) => {
    if (!editingPosition) return;
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

  const handleCloseEditPositionModal = () => {
    setEditingPosition(null);
    updatePosition.reset();
  };

  const handleOpenDeletePositionModal = (positionId: number) => {
    setDeletingPositionId(positionId);
    setShowDeletePositionModal(true);
  };

  const handleCloseDeletePositionModal = () => {
    setShowDeletePositionModal(false);
    setDeletingPositionId(null);
  };

  const handleDeletePosition = async () => {
    if (deletingPositionId === null) return;
    try {
      await deletePosition.mutateAsync({
        guildId,
        presetId,
        positionId: deletingPositionId,
      });
      handleCloseDeletePositionModal();
    } catch (err) {
      console.error("Failed to delete position:", err);
    }
  };

  return (
    <Section variantIntent="secondary" className={styles.wrapper}>
      <Section variantTone="ghost" variantLayout="row">
        <h3>포지션 목록</h3>
        <PrimaryButton onClick={handleOpenAddPositionModal}>추가</PrimaryButton>
      </Section>
      <Bar />

      <Section
        variantTone="ghost"
        variantLayout="column"
        variantIntent="secondary"
        className={styles.positionList}
      >
        {error ? (
          <Error detail={error?.message}>
            포지션 목록을 불러오는데 실패했습니다.
          </Error>
        ) : isLoading ? (
          <Loading />
        ) : (
          positions?.map((position) => (
            <PositionCard
              key={position.positionId}
              position={position}
              onEdit={() => setEditingPosition(position)}
              onDelete={() =>
                handleOpenDeletePositionModal(position.positionId)
              }
              isDeletePending={deletePosition.isPending}
            />
          ))
        )}
      </Section>

      {showAddPositionModal && (
        <AddPositionModal
          onClose={handleCloseAddPositionModal}
          onSubmit={handleAddPosition}
          isPending={addPosition.isPending}
          error={addPosition.isError ? addPosition.error : undefined}
        />
      )}

      {editingPosition && (
        <EditPositionModal
          position={editingPosition}
          onClose={handleCloseEditPositionModal}
          onSubmit={handleUpdatePosition}
          isPending={updatePosition.isPending}
          error={updatePosition.isError ? updatePosition.error : undefined}
        />
      )}

      {showDeletePositionModal && (
        <DeletePositionModal
          onClose={handleCloseDeletePositionModal}
          onConfirm={handleDeletePosition}
          isPending={deletePosition.isPending}
          error={deletePosition.isError ? deletePosition.error : undefined}
        />
      )}
    </Section>
  );
}
