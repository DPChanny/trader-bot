import { PrimaryButton } from "@components/atoms/button";
import { Modal, ModalFooter } from "@components/modal";
import { Error } from "@components/molecules/error";
import type { WSError } from "@utils/error";

interface NonBlockingErrorModalProps {
  error: WSError;
  onClose: () => void;
}

export function NonBlockingErrorModal({
  error,
  onClose,
}: NonBlockingErrorModalProps) {
  return (
    <Modal onClose={onClose} title="경매 진행 오류">
      <Error error={error}>경매 진행 오류가 발생했습니다</Error>
      <ModalFooter>
        <PrimaryButton onClick={onClose}>확인</PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
