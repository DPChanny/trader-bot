import { useState } from "preact/hooks";
import {
  useAddPosition,
  useDeletePosition,
  usePositions,
  useUpdatePosition,
} from "@hooks/position";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { Loading } from "@components/molecules/loading";
import { ErrorMessage } from "@components/molecules/errorMessage";
import { PrimaryButton } from "@components/atoms/button";
import { Row, Scroll } from "@components/atoms/layout";
import {
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { Title } from "@components/atoms/text";
import { AddPositionModal } from "./addPositionModal";
import { UpdatePositionModal } from "./updatePositionModal";
import { DeletePositionModal } from "./deletePositionModal";
import { PositionCard } from "./positionCard";
import type {
  AddPositionDTO,
  PositionDTO,
  UpdatePositionDTO,
} from "@dtos/position";

interface PositionEditorProps {
  guildId: string;
  presetId: number;
}

export function PositionEditor({ guildId, presetId }: PositionEditorProps) {
  const [showAddPositionModal, setShowAddPositionModal] = useState(false);
  const [updatingPosition, setUpdatingPosition] = useState<PositionDTO | null>(
    null,
  );
  const [deletingPositionId, setDeletingPositionId] = useState<number | null>(
    null,
  );

  const { data: positions, isLoading, error } = usePositions(guildId, presetId);
  const addPosition = useAddPosition();
  const updatePosition = useUpdatePosition();
  const deletePosition = useDeletePosition();
  const canEdit = useVerifyRole(guildId, Role.EDITOR);

  const handleOpenAddPositionModal = () => {
    setShowAddPositionModal(true);
  };

  const handleCloseAddPositionModal = () => {
    setShowAddPositionModal(false);
    addPosition.reset();
  };

  const handleAddPosition = async (dto: AddPositionDTO) => {
    await addPosition.mutateAsync({ guildId, presetId, dto });
  };

  const handleUpdatePosition = (dto: UpdatePositionDTO) => {
    if (!updatingPosition) return;
    updatePosition.mutate(
      {
        guildId,
        presetId,
        positionId: updatingPosition.positionId,
        dto,
      },
      {
        onSuccess: () => {
          setUpdatingPosition(null);
          updatePosition.reset();
        },
      },
    );
  };

  const handleCloseUpdatePositionModal = () => {
    setUpdatingPosition(null);
    updatePosition.reset();
  };

  const handleOpenDeletePositionModal = (positionId: number) => {
    setDeletingPositionId(positionId);
  };

  const handleCloseDeletePositionModal = () => {
    setDeletingPositionId(null);
    deletePosition.reset();
  };

  const handleDeletePosition = () => {
    if (deletingPositionId === null) return;
    deletePosition.mutate(
      {
        guildId,
        presetId,
        positionId: deletingPositionId,
      },
      {
        onSuccess: () => {
          handleCloseDeletePositionModal();
        },
      },
    );
  };

  return (
    <SecondarySection fill minSize>
      <Row justify="between" align="center">
        <Title>포지션 목록</Title>
        {canEdit && (
          <PrimaryButton onClick={handleOpenAddPositionModal}>
            추가
          </PrimaryButton>
        )}
      </Row>
      <TertiarySection fill>
        <Scroll axis="y">
          {error ? (
            <ErrorMessage error={error}>
              포지션 목록을 불러오지 못했습니다.
            </ErrorMessage>
          ) : isLoading ? (
            <Loading />
          ) : (
            positions?.map((position) => (
              <PositionCard
                key={position.positionId}
                position={position}
                guildId={guildId}
                onEdit={() => setUpdatingPosition(position)}
                onDelete={() =>
                  handleOpenDeletePositionModal(position.positionId)
                }
                isDeletePending={deletePosition.isPending}
              />
            ))
          )}
        </Scroll>
      </TertiarySection>

      {showAddPositionModal && (
        <AddPositionModal
          onClose={handleCloseAddPositionModal}
          onSubmit={handleAddPosition}
          isPending={addPosition.isPending}
          error={addPosition.isError ? addPosition.error : undefined}
        />
      )}

      {updatingPosition && (
        <UpdatePositionModal
          position={updatingPosition}
          onClose={handleCloseUpdatePositionModal}
          onSubmit={handleUpdatePosition}
          isPending={updatePosition.isPending}
          error={updatePosition.isError ? updatePosition.error : undefined}
        />
      )}

      {deletingPositionId !== null && (
        <DeletePositionModal
          onClose={handleCloseDeletePositionModal}
          onConfirm={handleDeletePosition}
          isPending={deletePosition.isPending}
          error={deletePosition.isError ? deletePosition.error : undefined}
        />
      )}
    </SecondarySection>
  );
}
