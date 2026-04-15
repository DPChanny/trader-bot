import { Modal, ModalFooter } from "@/app/components/molecules/modal";
import { PrimaryButton, SecondaryButton } from "@/app/components/atoms/button";
import { ErrorMessage } from "@/app/components/molecules/errorMessage";
import { Column } from "@/app/components/atoms/layout";

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
      <Column gap="sm">
        정말 이 멤버를 프리셋에서 제거하시겠습니까?
        {error && (
          <ErrorMessage error={error}>
            프리셋 멤버 제거에 실패했습니다.
          </ErrorMessage>
        )}
        <ModalFooter>
          <SecondaryButton
            type="button"
            onClick={handleClose}
            disabled={isPending}
          >
            취소
          </SecondaryButton>
          <PrimaryButton type="button" onClick={onConfirm} disabled={isPending}>
            제거
          </PrimaryButton>
        </ModalFooter>
      </Column>
    </Modal>
  );
}
