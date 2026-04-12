import { Modal, ModalFooter } from "@/components/commons/modal";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error } from "@/components/commons/error";
import { Section } from "@/components/commons/section";

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
      <Section variantTone="ghost" variantIntent="secondary">
        정말 이 프리셋을 삭제하시겠습니까?
        {error && <Error detail={error?.message}>삭제에 실패했습니다.</Error>}
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
