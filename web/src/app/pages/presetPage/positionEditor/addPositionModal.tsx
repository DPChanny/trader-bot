import { useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@/app/components/molecules/modal";
import { LabelInput } from "@/app/components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@/app/components/atoms/button";
import { ErrorMessage } from "@/app/components/molecules/errorMessage";
import { AddPositionSchema, type AddPositionDTO } from "@/dtos/position";

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
  const parseResult = AddPositionSchema.safeParse({ name, iconUrl });
  const isFormValid = parseResult.success;

  const handleClose = () => {
    if (isPending) return;
    setName("");
    setIconUrl("");
    onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!parseResult.success) return;
    try {
      await onSubmit(parseResult.data);
      handleClose();
    } catch {}
  };

  return (
    <Modal onClose={handleClose} title="포지션 추가">
      <ModalForm onSubmit={handleSubmit}>
        {error ? (
          <ErrorMessage error={error}>포지션 추가에 실패했습니다.</ErrorMessage>
        ) : null}
        <LabelInput
          label="포지션 이름"
          type="text"
          value={name}
          onValueChange={setName}
          required
        />
        <LabelInput
          label="아이콘 링크"
          type="text"
          value={iconUrl}
          onValueChange={setIconUrl}
        />
        <ModalFooter>
          <SecondaryButton onClick={handleClose} disabled={isPending}>
            취소
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending || !isFormValid}>
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
