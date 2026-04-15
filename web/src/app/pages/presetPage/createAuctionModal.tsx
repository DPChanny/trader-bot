import { useState } from "preact/hooks";
import { Modal, ModalFooter } from "@components/modal";
import { LabelToggle } from "@components/molecules/labelToggle";
import { SecondaryButton, Button } from "@components/atoms/button";
import { ErrorMessage } from "@components/molecules/errorMessage";
import type { CreateAuctionDTO } from "@dtos/auction";

interface CreateAuctionModalProps {
  onClose: () => void;
  onSubmit: (dto: CreateAuctionDTO) => Promise<void>;
  isPending: boolean;
  error?: any;
  message?: string;
  isHardError?: boolean;
}

export function CreateAuctionModal({
  onClose,
  onSubmit,
  isPending,
  error,
  message,
  isHardError = false,
}: CreateAuctionModalProps) {
  const [isPublic, setIsPublic] = useState(true);
  const [sendInvite, setSendInvite] = useState(true);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Modal onClose={handleClose} title="경매 생성">
      {message && <ErrorMessage>{message}</ErrorMessage>}
      {error && (
        <ErrorMessage error={error}>경매를 생성하지 못했습니다.</ErrorMessage>
      )}
      <LabelToggle
        label="퍼블릭 허용"
        isPressed={isPublic}
        onClick={() => setIsPublic((v) => !v)}
      >
        {isPublic ? "허용" : "비허용"}
      </LabelToggle>
      <LabelToggle
        label="초대 발송"
        isPressed={sendInvite}
        onClick={() => setSendInvite((v) => !v)}
      >
        {sendInvite ? "발송" : "미발송"}
      </LabelToggle>
      <ModalFooter>
        <SecondaryButton
          type="button"
          onClick={handleClose}
          disabled={isPending}
        >
          취소
        </SecondaryButton>
        <Button
          type="button"
          onClick={() => onSubmit({ isPublic, sendInvite })}
          disabled={isPending || isHardError}
        >
          생성
        </Button>
      </ModalFooter>
    </Modal>
  );
}
