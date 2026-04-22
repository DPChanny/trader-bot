import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { useGuildId, usePresetId } from "@hooks/route";
import { useDeletePosition } from "@features/position/hook";

interface DeletePositionModalProps {
  positionId: number;
  onClose: () => void;
}

export function DeletePositionModal({
  positionId,
  onClose,
}: DeletePositionModalProps) {
  const guildId = useGuildId();
  const presetId = usePresetId();
  const deletePosition = useDeletePosition();
  const formId = "delete-position-form";

  const handleClose = () => {
    if (deletePosition.isPending) return;
    onClose();
  };

  const onSubmit = () => {
    if (deletePosition.isPending) return;
    deletePosition.mutate(
      { guildId, presetId, positionId },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal onClose={handleClose} title="포지션 삭제">
      <ModalForm
        id={formId}
        onSubmit={onSubmit}
        disabled={deletePosition.isPending}
      >
        정말 이 포지션을 삭제하시겠습니까?
        {deletePosition.error && (
          <Error error={deletePosition.error}>포지션 삭제에 실패했습니다</Error>
        )}
      </ModalForm>
      <ModalFooter>
        <SecondaryButton
          onClick={handleClose}
          disabled={deletePosition.isPending}
        >
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={deletePosition.isPending}
        >
          삭제
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
