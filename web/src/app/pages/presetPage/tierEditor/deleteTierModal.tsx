import { Modal, ModalFooter } from "@components/modal";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { ErrorMessage } from "@components/molecules/errorMessage";

interface DeleteTierModalProps {
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  error?: any;
}

export function DeleteTierModal({
  onClose,
  onConfirm,
  isPending,
  error,
}: DeleteTierModalProps) {
  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Modal onClose={handleClose} title="티어 삭제">
      정말 이 티어를 삭제하시겠습니까?
      {error && (
        <ErrorMessage error={error}>티어를 삭제하지 못했습니다.</ErrorMessage>
      )}
      <ModalFooter>
        <SecondaryButton
          type="button"
          onClick={handleClose}
          disabled={isPending}
        >
          취소
        </SecondaryButton>
        <PrimaryButton type="button" onClick={onConfirm} disabled={isPending}>
          삭제
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
