import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { ErrorMessage } from "@components/molecules/errorMessage";

interface DeleteTierModalProps {
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isPending: boolean;
  error?: any;
}

export function DeleteTierModal({
  onClose,
  onConfirm,
  isPending,
  error,
}: DeleteTierModalProps) {
  const formId = "delete-tier-form";

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    onConfirm();
  };

  return (
    <Modal onClose={handleClose} title="티어 삭제">
      <ModalForm id={formId} onSubmit={handleSubmit}>
        정말 이 티어를 삭제하시겠습니까?
        {error && (
          <ErrorMessage error={error}>티어를 삭제하지 못했습니다.</ErrorMessage>
        )}
      </ModalForm>
      <ModalFooter>
        <SecondaryButton onClick={handleClose} disabled={isPending}>
          취소
        </SecondaryButton>
        <PrimaryButton type="submit" form={formId} disabled={isPending}>
          삭제
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
