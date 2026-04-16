import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { useDeleteTier } from "@hooks/tier";

interface DeleteTierModalProps {
  guildId: string;
  presetId: number;
  tierId: number;
  onClose: () => void;
}

export function DeleteTierModal({
  guildId,
  presetId,
  tierId,
  onClose,
}: DeleteTierModalProps) {
  const deleteTier = useDeleteTier();
  const formId = "delete-tier-form";

  const handleClose = () => {
    if (deleteTier.isPending) return;
    onClose();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (deleteTier.isPending) return;
    deleteTier.mutate({ guildId, presetId, tierId }, { onSuccess: onClose });
  };

  return (
    <Modal onClose={handleClose} title="티어 삭제">
      <ModalForm id={formId} onSubmit={handleSubmit}>
        정말 이 티어를 삭제하시겠습니까?
        {deleteTier.error && (
          <Error error={deleteTier.error}>티어 삭제에 실패했습니다</Error>
        )}
      </ModalForm>
      <ModalFooter>
        <SecondaryButton onClick={handleClose} disabled={deleteTier.isPending}>
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={deleteTier.isPending}
        >
          삭제
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
