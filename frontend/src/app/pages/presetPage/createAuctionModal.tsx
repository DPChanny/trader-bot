import { useState } from "preact/hooks";
import { useGuildId, usePresetId } from "@hooks/router";
import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { LabelToggle } from "@components/molecules/labelToggle";
import { SecondaryButton, Button } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { useCreateAuction } from "@hooks/auction";

interface CreateAuctionModalProps {
  onClose: () => void;
  onSuccess: (auctionId: string) => void;
  isHardError: boolean;
}

export function CreateAuctionModal({
  onClose,
  onSuccess,
  isHardError,
}: CreateAuctionModalProps) {
  const guildId = useGuildId();
  const presetId = usePresetId();
  const [isPublic, setIsPublic] = useState(true);
  const [sendInvite, setSendInvite] = useState(true);
  const createAuction = useCreateAuction();
  const formId = "create-auction-form";

  const handleClose = () => {
    if (createAuction.isPending) return;
    onClose();
  };

  const onSubmit = () => {
    if (createAuction.isPending || isHardError) return;
    createAuction.mutate(
      { guildId, presetId, dto: { isPublic, sendInvite } },
      { onSuccess: (result) => onSuccess(result.auctionId) },
    );
  };

  return (
    <Modal onClose={handleClose} title="경매 생성">
      <ModalForm
        id={formId}
        onSubmit={onSubmit}
        disabled={createAuction.isPending}
      >
        {createAuction.error && (
          <Error error={createAuction.error}>경매 생성에 실패했습니다</Error>
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
      </ModalForm>
      <ModalFooter>
        <SecondaryButton
          onClick={handleClose}
          disabled={createAuction.isPending}
        >
          취소
        </SecondaryButton>
        <Button
          type="submit"
          form={formId}
          disabled={createAuction.isPending || isHardError}
        >
          생성
        </Button>
      </ModalFooter>
    </Modal>
  );
}
