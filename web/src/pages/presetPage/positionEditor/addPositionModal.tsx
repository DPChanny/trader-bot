import { useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";
import type { AddPositionDTO } from "@/dtos/positionDto";

interface AddPositionModalProps {
  onClose: () => void;
  onSubmit: (dto: AddPositionDTO) => Promise<void>;
  isPending: boolean;
  error?: any;
}

export function AddPositionModal({
  onClose,
  onSubmit,
  isPending,
  error,
}: AddPositionModalProps) {
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");

  const handleClose = () => {
    if (isPending) return;
    setName("");
    setIconUrl("");
    onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!name.trim()) return;

    const dto: AddPositionDTO = {
      name: name.trim(),
      iconUrl: iconUrl.trim() || null,
    };

    try {
      await onSubmit(dto);
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
          value={name}
          onChange={setName}
        />
        <LabelInput
          label="아이콘 URL (선택사항)"
          type="text"
          value={iconUrl}
          onChange={setIconUrl}
        />
        <ModalFooter>
          <SecondaryButton onClick={handleClose} disabled={isPending}>
            취소
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending || !name.trim()}>
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
