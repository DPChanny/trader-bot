import { useEffect, useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";
import type { PositionDTO } from "@/dtos/positionDto";

interface EditPositionModalProps {
  position: PositionDTO;
  onClose: () => void;
  onSubmit: (name: string, iconUrl: string | null) => void;
  isPending: boolean;
  error?: any;
}

export function EditPositionModal({
  position,
  onClose,
  onSubmit,
  isPending,
  error,
}: EditPositionModalProps) {
  const [name, setName] = useState(position.name);
  const [iconUrl, setIconUrl] = useState(position.iconUrl ?? "");

  useEffect(() => {
    setName(position.name);
    setIconUrl(position.iconUrl ?? "");
  }, [position.positionId, position.name, position.iconUrl]);

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), iconUrl.trim() || null);
  };

  return (
    <Modal onClose={handleClose} title="포지션 수정">
      <ModalForm onSubmit={handleSubmit}>
        {error ? (
          <ErrorMessage detail={error?.message}>
            포지션 수정에 실패했습니다.
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
            저장
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
