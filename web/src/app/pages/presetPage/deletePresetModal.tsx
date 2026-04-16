import { route } from "preact-router";
import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { useDeletePreset } from "@hooks/preset";

interface DeletePresetModalProps {
  guildId: string;
  presetId: number;
  onClose: () => void;
}

export function DeletePresetModal({
  guildId,
  presetId,
  onClose,
}: DeletePresetModalProps) {
  const deletePreset = useDeletePreset();
  const formId = "delete-preset-form";

  const handleClose = () => {
    if (deletePreset.isPending) return;
    onClose();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    deletePreset.mutate(
      { guildId, presetId },
      { onSuccess: () => route(`/guild/${guildId}/member`) },
    );
  };

  return (
    <Modal onClose={handleClose} title="프리셋 삭제">
      <ModalForm id={formId} onSubmit={handleSubmit}>
        정말 이 프리셋을 삭제하시겠습니까?
        {deletePreset.isError && <Error error={deletePreset.error} />}
      </ModalForm>
      <ModalFooter>
        <SecondaryButton
          onClick={handleClose}
          disabled={deletePreset.isPending}
        >
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={deletePreset.isPending}
        >
          삭제
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
