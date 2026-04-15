import { useState } from "preact/hooks";
import { Modal, ModalForm, ModalFooter } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { ErrorMessage } from "@components/molecules/errorMessage";
import { AddTierSchema, type AddTierDTO } from "@dtos/tier";

interface AddTierModalProps {
  onClose: () => void;
  onSubmit: (dto: AddTierDTO) => Promise<void>;
  isPending: boolean;
  error?: any;
}

export function AddTierModal({
  onClose,
  onSubmit,
  isPending,
  error,
}: AddTierModalProps) {
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const parseResult = AddTierSchema.safeParse({ name, iconUrl });
  const isFormValid = parseResult.success;
  const formId = "add-tier-form";

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
    <Modal onClose={handleClose} title="티어 추가">
      <ModalForm id={formId} onSubmit={handleSubmit}>
        {error ? (
          <ErrorMessage error={error}>티어를 추가하지 못했습니다.</ErrorMessage>
        ) : null}
        <LabelInput
          label="티어 이름"
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
