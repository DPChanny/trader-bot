import { Modal, ModalFooter } from "@/components/commons/modal";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error } from "@/components/commons/error";
import { Section } from "@/components/commons/section";

interface DeletePositionModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  error?: any;
}

export function DeletePositionModal({
  onClose,
  onConfirm,
  isPending,
  error,
}: DeletePositionModalProps) {
  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Modal onClose={handleClose} title="포지션 삭제">
      <Section variantTone="ghost" variantIntent="secondary">
        정말 이 포지션을 삭제하시겠습니까?
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
            {isPending ? "삭제 중..." : "삭제"}
          </PrimaryButton>
        </ModalFooter>
      </Section>
    </Modal>
  );
}
