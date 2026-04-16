import { Modal, ModalFooter } from "@components/modal";
import { Link } from "@components/atoms/link";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Text } from "@components/atoms/text";

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
      <Text>
        <Link href={auctionHref} onClick={onClose}>
          경매
        </Link>
        가 생성되었습니다.
      </Text>
      <ModalFooter>
        <SecondaryButton onClick={onClose}>닫기</SecondaryButton>
        <PrimaryButton onClick={() => navigator.clipboard.writeText(link)}>
          링크 복사
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
