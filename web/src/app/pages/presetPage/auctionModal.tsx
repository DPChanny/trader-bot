import { route } from "preact-router";
import { Modal, ModalFooter } from "@components/molecules/modal";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";

interface AuctionModalProps {
  auctionId: string;
  onClose: () => void;
}

export function AuctionModal({ auctionId, onClose }: AuctionModalProps) {
  const link = `${window.location.origin}/auction/${auctionId}`;

  const handleJoin = () => {
    onClose();
    route(`/auction/${auctionId}`);
  };

  return (
    <Modal onClose={onClose} title="경매 생성 완료">
      경매가 생성되었습니다.
      <ModalFooter>
        <SecondaryButton type="button" onClick={onClose}>
          닫기
        </SecondaryButton>
        <SecondaryButton
          type="button"
          onClick={() => navigator.clipboard.writeText(link)}
        >
          링크 복사
        </SecondaryButton>
        <PrimaryButton type="button" onClick={handleJoin}>
          경매 참가
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
