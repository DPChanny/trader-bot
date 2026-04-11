import { useState } from "preact/hooks";
import { Modal, ModalFooter } from "@/components/commons/modal";
import { Toggle } from "@/components/commons/toggle";
import { Label } from "@/components/commons/label";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error } from "@/components/commons/error";
import { Section } from "@/components/commons/section";
import type { AddAuctionDTO } from "@/dtos/auctionDto";

interface AddAuctionModalProps {
  onClose: () => void;
  onSubmit: (dto: AddAuctionDTO) => Promise<void>;
  isPending: boolean;
  error?: any;
}

export function AddAuctionModal({
  onClose,
  onSubmit,
  isPending,
  error,
}: AddAuctionModalProps) {
  const [allowPublic, setAllowPublic] = useState(true);
  const [sendInvite, setSendInvite] = useState(true);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Modal onClose={handleClose} title="경매 생성">
      <Section variantTone="ghost" variantIntent="secondary">
        {error && (
          <Error detail={error?.message}>경매 생성에 실패했습니다.</Error>
        )}
        <Section
          variantTone="ghost"
          variantLayout="row"
          variantIntent="secondary"
        >
          <Label>퍼블릭 허용</Label>
          <Toggle
            isActive={allowPublic}
            onClick={() => setAllowPublic((v) => !v)}
          >
            {allowPublic ? "허용" : "비허용"}
          </Toggle>
        </Section>
        <Section
          variantTone="ghost"
          variantLayout="row"
          variantIntent="secondary"
        >
          <Label>초대 발송</Label>
          <Toggle
            isActive={sendInvite}
            onClick={() => setSendInvite((v) => !v)}
          >
            {sendInvite ? "발송" : "미발송"}
          </Toggle>
        </Section>
        <ModalFooter>
          <SecondaryButton
            type="button"
            onClick={handleClose}
            disabled={isPending}
          >
            취소
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => onSubmit({ allowPublic, sendInvite })}
            disabled={isPending}
          >
            {isPending ? "생성 중..." : "생성"}
          </PrimaryButton>
        </ModalFooter>
      </Section>
    </Modal>
  );
}
