import { Modal, ModalFooter } from "@components/modal";
import { Link } from "@components/atoms/link";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Text } from "@components/atoms/text";

interface AuctionCreatedModalProps {
  guildId: string;
  presetId: number;
  auctionId: string;
  onClose: () => void;
}

export function AuctionCreatedModal({
  guildId,
  presetId,
  auctionId,
  onClose,
}: AuctionCreatedModalProps) {
  const auctionURL = `/guild/${guildId}/preset/${presetId}/auction/${auctionId}`;
  const link = `${window.location.origin}${auctionURL}`;

  return (
    <Modal onClose={onClose} title="경매 생성 완료">
      <Text>
        <Link href={auctionURL} onClick={onClose}>
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
