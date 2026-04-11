import { useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";
import { useAddPosition } from "@/hooks/position";

const INITIAL_STATE = { positionName: "", positionIconUrl: "" };

interface AddPositionModalProps {
  guildId: string;
  presetId: number;
  isOpen: boolean;
  onClose: () => void;
}

export function AddPositionModal({
  guildId,
  presetId,
  isOpen,
  onClose,
}: AddPositionModalProps) {
  const [positionName, setPositionName] = useState(INITIAL_STATE.positionName);
  const [positionIconUrl, setPositionIconUrl] = useState(
    INITIAL_STATE.positionIconUrl,
  );
  const addPosition = useAddPosition();

  const handleClose = () => {
    setPositionName(INITIAL_STATE.positionName);
    setPositionIconUrl(INITIAL_STATE.positionIconUrl);
    addPosition.reset();
    onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!positionName.trim()) return;
    try {
      await addPosition.mutateAsync({
        guildId,
        presetId,
        dto: {
          name: positionName.trim(),
          iconUrl: positionIconUrl.trim() || null,
        },
      });
      handleClose();
    } catch {}
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="포지션 추가">
      <ModalForm onSubmit={handleSubmit}>
        {addPosition.isError ? (
          <ErrorMessage detail={addPosition.error.message}>
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
          <SecondaryButton onClick={handleClose}>취소</SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={addPosition.isPending || !positionName.trim()}
          >
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
