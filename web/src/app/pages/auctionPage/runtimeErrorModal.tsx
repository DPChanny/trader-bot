import { PrimaryButton } from "@components/atoms/button";
import { Modal, ModalFooter } from "@components/modal";
import { ErrorMessage } from "@components/molecules/errorMessage";
import type { WSError } from "@utils/error";

interface RuntimeErrorModalProps {
  error: WSError;
  onClose: () => void;
}

export function RuntimeErrorModal({ error, onClose }: RuntimeErrorModalProps) {
  return (
    <Modal onClose={onClose} title="경매 오류">
      <ErrorMessage error={error} />
      <ModalFooter>
        <PrimaryButton onClick={onClose}>확인</PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
