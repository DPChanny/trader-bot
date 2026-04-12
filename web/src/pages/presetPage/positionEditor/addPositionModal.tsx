import { useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";

interface AddPositionModalProps {
  onClose: () => void;
  onSubmit: (input: { name: string; iconUrl: string | null }) => Promise<void>;
  isPending: boolean;
  error?: any;
}

export function AddPositionModal({
  onClose,
  onSubmit,
  isPending,
  error,
}: AddPositionModalProps) {
  const [positionName, setPositionName] = useState("");
  const [positionIconUrl, setPositionIconUrl] = useState("");

  const handleClose = () => {
    if (isPending) return;
    setPositionName("");
    setPositionIconUrl("");
    onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!positionName.trim()) return;
    try {
      await onSubmit({
        name: positionName.trim(),
        iconUrl: positionIconUrl.trim() || null,
      });
      handleClose();
    } catch {}
  };

  return (
    <Modal onClose={handleClose} title="포지션 추가">
      <ModalForm onSubmit={handleSubmit}>
        {error ? (
          <ErrorMessage detail={error?.message}>
            포지션 추가에 실패했습니다.
          </ErrorMessage>
        ) : null}
        <LabelInput
          label="포지션 이름"
          type="text"
          value={positionName}
          onChange={setPositionName}
        />
        <LabelInput
          label="아이콘 URL (선택사항)"
          type="text"
          value={positionIconUrl}
          onChange={setPositionIconUrl}
        />
        <ModalFooter>
          <SecondaryButton onClick={handleClose} disabled={isPending}>
            취소
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isPending || !positionName.trim()}
          >
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
