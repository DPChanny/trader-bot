import { Modal, ModalFooter } from "@/components/commons/modal";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Section } from "@/components/commons/section";

interface AuctionLinkModalProps {
  auctionId: string;
  onClose: () => void;
}

export function AuctionLinkModal({
  auctionId,
  onClose,
}: AuctionLinkModalProps) {
  const link = `${window.location.origin}/auction/${auctionId}`;

  return (
    <Modal onClose={onClose} title="경매 생성 완료">
      <Section variantTone="ghost" variantIntent="secondary">
        경매가 생성되었습니다.
        <br />
        링크: {link}
        <ModalFooter>
          <SecondaryButton type="button" onClick={onClose}>
            닫기
          </SecondaryButton>
          <PrimaryButton
            type="button"
            onClick={() => navigator.clipboard.writeText(link)}
          >
            링크 복사
          </PrimaryButton>
        </ModalFooter>
      </Section>
    </Modal>
  );
}
