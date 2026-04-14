import { useState } from "preact/hooks";
import { Modal, ModalFooter } from "@/components/commons/modal";
import { Toggle } from "@/components/commons/toggle";
import { Label } from "@/components/commons/label";
import { SecondaryButton, Button } from "@/components/commons/button";
import { Error } from "@/components/commons/error";
import { Column, Row } from "@/components/commons/layout";
import type { CreateAuctionDTO } from "@/dtos/auction";

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
      <Column gap="sm">
        {message && <Error>{message}</Error>}
        {error && <Error error={error}>경매 생성에 실패했습니다.</Error>}
        <Row
          gap="sm"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Label>퍼블릭 허용</Label>
          <Toggle isActive={isPublic} onClick={() => setIsPublic((v) => !v)}>
            {isPublic ? "허용" : "비허용"}
          </Toggle>
        </Row>
        <Row
          gap="sm"
          style={{ justifyContent: "space-between", alignItems: "center" }}
        >
          <Label>초대 발송</Label>
          <Toggle
            isActive={sendInvite}
            onClick={() => setSendInvite((v) => !v)}
          >
            {sendInvite ? "발송" : "미발송"}
          </Toggle>
        </Row>
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
      </Column>
    </Modal>
  );
}
