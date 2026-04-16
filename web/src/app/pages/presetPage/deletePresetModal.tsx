import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";

interface DeletePresetModalProps {
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  isPending: boolean;
  error?: any;
}

export function DeletePresetModal({
  onClose,
  onConfirm,
  isPending,
  error,
}: DeletePresetModalProps) {
  const formId = "delete-preset-form";

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await onConfirm();
  };

  return (
    <Modal onClose={handleClose} title="프리셋 삭제">
      <ModalForm id={formId} onSubmit={handleSubmit}>
        정말 이 프리셋을 삭제하시겠습니까?
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
