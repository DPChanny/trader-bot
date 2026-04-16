import { route } from "preact-router";
import { useGuildId, usePresetId } from "@hooks/router";
import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { useDeletePreset } from "@hooks/preset";

interface DeletePresetModalProps {
  onClose: () => void;
}

export function DeletePresetModal({ onClose }: DeletePresetModalProps) {
  const guildId = useGuildId()!;
  const presetId = usePresetId()!;
  const deletePreset = useDeletePreset();
  const formId = "delete-preset-form";

  const handleClose = () => {
    if (deletePreset.isPending) return;
    onClose();
  };

  const onSubmit = () => {
    if (deletePreset.isPending) return;
    deletePreset.mutate(
      { guildId, presetId },
      { onSuccess: () => route(`/guild/${guildId}/member`) },
    );
  };

  return (
    <Modal onClose={handleClose} title="프리셋 삭제">
      <ModalForm
        id={formId}
        onSubmit={onSubmit}
        disabled={deletePreset.isPending}
      >
        정말 이 프리셋을 삭제하시겠습니까?
        {deletePreset.error && (
          <Error error={deletePreset.error}>프리셋 삭제에 실패했습니다</Error>
        )}
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
