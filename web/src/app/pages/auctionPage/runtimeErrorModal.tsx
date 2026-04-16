import { PrimaryButton } from "@components/atoms/button";
import { Modal, ModalFooter } from "@components/modal";
import { Error } from "@components/molecules/error";
import type { WSError } from "@utils/error";

interface RuntimeErrorModalProps {
  error: WSError;
  onClose: () => void;
}

export function RuntimeErrorModal({ error, onClose }: RuntimeErrorModalProps) {
  return (
    <Modal onClose={onClose} title="경매 오류">
      <Error error={error} />
      <ModalFooter>
        <PrimaryButton onClick={onClose}>확인</PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
