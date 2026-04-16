import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import type { AppError } from "@utils/error";

interface DeleteTierModalProps {
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isPending: boolean;
  error?: AppError;
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
        {error && <Error error={error} />}
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
