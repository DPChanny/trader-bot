import { useState } from "preact/hooks";
import { Modal, ModalForm, ModalFooter } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";
import { useAddTier } from "@/hooks/tier";

const INITIAL_STATE = { tierName: "", tierIconUrl: "" };

interface AddTierModalProps {
  guildId: string;
  presetId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AddTierModal({
  guildId,
  presetId,
  isOpen,
  onClose,
}: AddTierModalProps) {
  const [tierName, setTierName] = useState(INITIAL_STATE.tierName);
  const [tierIconUrl, setTierIconUrl] = useState(INITIAL_STATE.tierIconUrl);
  const addTier = useAddTier();

  const handleClose = () => {
    setTierName(INITIAL_STATE.tierName);
    setTierIconUrl(INITIAL_STATE.tierIconUrl);
    addTier.reset();
    onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!tierName.trim() || !guildId || !presetId) return;
    try {
      await addTier.mutateAsync({
        guildId,
        presetId,
        dto: { name: tierName.trim(), iconUrl: tierIconUrl.trim() || null },
      });
      handleClose();
    } catch {}
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="티어 추가">
      <ModalForm onSubmit={handleSubmit}>
        {addTier.isError ? (
          <ErrorMessage detail={addTier.error.message}>
            티어 추가에 실패했습니다.
          </ErrorMessage>
        ) : null}
        <LabelInput
          label="티어 이름"
          type="text"
          value={tierName}
          onChange={setTierName}
        />
        <LabelInput
          label="아이콘 URL (선택사항)"
          type="text"
          value={tierIconUrl}
          onChange={setTierIconUrl}
        />
        <ModalFooter>
          <SecondaryButton onClick={handleClose}>취소</SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={addTier.isPending || !tierName.trim()}
          >
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
