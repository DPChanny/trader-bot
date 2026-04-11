import { useState } from "preact/hooks";
import { Modal, ModalForm, ModalFooter } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";

const INITIAL_STATE = { tierName: "", tierIconUrl: "" };

interface AddTierModalProps {
  onClose: () => void;
  onSubmit: (input: { name: string; iconUrl: string | null }) => Promise<void>;
  isPending: boolean;
  error?: any;
}

export function AddTierModal({
  onClose,
  onSubmit,
  isPending,
  error,
}: AddTierModalProps) {
  const [tierName, setTierName] = useState(INITIAL_STATE.tierName);
  const [tierIconUrl, setTierIconUrl] = useState(INITIAL_STATE.tierIconUrl);

  const handleClose = () => {
    setTierName(INITIAL_STATE.tierName);
    setTierIconUrl(INITIAL_STATE.tierIconUrl);
    onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!tierName.trim()) return;
    try {
      await onSubmit({
        name: tierName.trim(),
        iconUrl: tierIconUrl.trim() || null,
      });
      handleClose();
    } catch {}
  };

  return (
    <Modal onClose={handleClose} title="티어 추가">
      <ModalForm onSubmit={handleSubmit}>
        {error ? (
          <ErrorMessage detail={error?.message}>
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
          <PrimaryButton type="submit" disabled={isPending || !tierName.trim()}>
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
