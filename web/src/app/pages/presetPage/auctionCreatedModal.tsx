import { Modal, ModalFooter } from "@components/modal";
import { Link } from "@components/atoms/link";
import { SecondaryButton } from "@components/atoms/button";

interface AuctionCreatedModalProps {
  auctionId: string;
  onClose: () => void;
}

export function AuctionCreatedModal({
  auctionId,
  onClose,
}: AuctionCreatedModalProps) {
  const link = `${window.location.origin}/auction/${auctionId}`;
  const auctionHref = `/auction/${auctionId}`;

  return (
    <Modal onClose={onClose} title="경매 생성 완료">
      <>
        <Link href={auctionHref} onClick={onClose}>
          경매
        </Link>
        가 생성되었습니다.
      </>
      <ModalFooter>
        <SecondaryButton onClick={onClose}>닫기</SecondaryButton>
        <SecondaryButton onClick={() => navigator.clipboard.writeText(link)}>
          링크 복사
        </SecondaryButton>
      </ModalFooter>
    </Modal>
  );
}
