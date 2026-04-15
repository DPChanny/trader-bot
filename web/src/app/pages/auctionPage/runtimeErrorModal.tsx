import { PrimaryButton } from "@components/atoms/button";
import { Modal, ModalFooter } from "@components/modal";
import { ErrorMessage } from "@components/molecules/errorMessage";
import { AUCTION_RUNTIME_ERROR_MESSAGE, type WSError } from "@utils/error";

interface RuntimeErrorModalProps {
  error: WSError;
  onClose: () => void;
}

export function RuntimeErrorModal({ error, onClose }: RuntimeErrorModalProps) {
  return (
    <Modal onClose={onClose} title="경매 오류">
      <ErrorMessage error={error}>{AUCTION_RUNTIME_ERROR_MESSAGE}</ErrorMessage>
      <ModalFooter>
        <PrimaryButton onClick={onClose}>확인</PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
