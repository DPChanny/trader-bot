import { PrimaryButton } from "@components/atoms/button";
import { Modal, ModalFooter } from "@components/modal";
import { Error } from "@components/molecules/error";
import type { WSError } from "@utils/error";

interface UnexpectedErrorModalProps {
  error: WSError;
  onClose: () => void;
}

export function UnexpectedErrorModal({
  error,
  onClose,
}: UnexpectedErrorModalProps) {
  return (
    <Modal onClose={onClose} title="예기치 못한 오류">
      <Error error={error}>예기치 못한 오류</Error>
      <ModalFooter>
        <PrimaryButton onClick={onClose}>확인</PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
