import { Modal, ModalFooter } from "@/app/components/molecules/modal";
import { PrimaryButton, SecondaryButton } from "@/app/components/atoms/button";
import { ErrorMessage } from "@/app/components/molecules/errorMessage";
import { Column } from "@/app/components/atoms/layout";

interface DeleteTierModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
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
      <Column gap="sm">
        정말 이 티어를 삭제하시겠습니까?
        {error && (
          <ErrorMessage error={error}>티어 삭제에 실패했습니다.</ErrorMessage>
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
      </Column>
    </Modal>
  );
}
