import { Modal, ModalFooter } from "@/components/commons/modal";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error } from "@/components/commons/error";
import { Section } from "@/components/commons/section";

interface DeletePresetMemberModalProps {
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isPending: boolean;
  error?: any;
}

export function DeletePresetMemberModal({
  onClose,
  onConfirm,
  isPending,
  error,
}: DeletePresetMemberModalProps) {
  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Modal onClose={handleClose} title="프리셋 멤버 제거">
      <Section variantTone="ghost" variantIntent="secondary">
        정말 이 멤버를 프리셋에서 제거하시겠습니까?
        {error && <Error detail={error?.message}>제거에 실패했습니다.</Error>}
        <ModalFooter>
          <SecondaryButton
            type="button"
            onClick={handleClose}
            disabled={isPending}
          >
            취소
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? "제거 중..." : "제거"}
          </PrimaryButton>
        </ModalFooter>
      </Section>
    </Modal>
  );
}
