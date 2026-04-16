import { useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { AddPositionSchema, type AddPositionDTO } from "@dtos/position";
import type { AppError } from "@utils/error";

interface AddPositionModalProps {
  onClose: () => void;
  onSubmit: (dto: AddPositionDTO) => void | Promise<void>;
  isPending: boolean;
  error?: AppError;
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
  const formId = "add-position-form";

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
      <ModalForm id={formId} onSubmit={handleSubmit}>
        {error && <Error error={error} />}
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
      </ModalForm>
      <ModalFooter>
        <SecondaryButton onClick={handleClose} disabled={isPending}>
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={isPending || !isFormValid}
        >
          추가
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
