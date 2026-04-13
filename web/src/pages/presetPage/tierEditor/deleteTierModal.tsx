import { Modal, ModalFooter } from "@/components/commons/modal";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error } from "@/components/commons/error";
import { Section } from "@/components/commons/section";

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
      <Section variantTone="ghost" variantIntent="secondary">
        정말 이 티어를 삭제하시겠습니까?
        {error && <Error error={error}>티어 삭제에 실패했습니다.</Error>}
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
      </Section>
    </Modal>
  );
}
