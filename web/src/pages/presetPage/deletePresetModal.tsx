import { Modal, ModalFooter } from "@/components/commons/modal";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { ErrorMessage } from "@/components/commons/error";
import { Column } from "@/components/commons/layout";

interface DeletePresetModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  error?: any;
}

export function DeletePresetModal({
  onClose,
  onConfirm,
  isPending,
  error,
}: DeletePresetModalProps) {
  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Modal onClose={handleClose} title="프리셋 삭제">
      <Column gap="sm">
        정말 이 프리셋을 삭제하시겠습니까?
        {error && (
          <ErrorMessage error={error}>프리셋 삭제에 실패했습니다.</ErrorMessage>
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
