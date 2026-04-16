import { useState } from "preact/hooks";
import { Modal, ModalForm, ModalFooter } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { AddTierSchema } from "@dtos/tier";
import { useAddTier } from "@hooks/tier";

interface AddTierModalProps {
  guildId: string;
  presetId: number;
  onClose: () => void;
}

export function AddTierModal({
  guildId,
  presetId,
  onClose,
}: AddTierModalProps) {
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const addTier = useAddTier();
  const parseResult = AddTierSchema.safeParse({ name, iconUrl });
  const isFormValid = parseResult.success;
  const formId = "add-tier-form";

  const handleClose = () => {
    if (addTier.isPending) return;
    setName("");
    setIconUrl("");
    onClose();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (addTier.isPending) return;
    if (!parseResult.success) return;
    addTier.mutate(
      { guildId, presetId, dto: parseResult.data },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal onClose={handleClose} title="티어 추가">
      <ModalForm id={formId} onSubmit={handleSubmit}>
        {addTier.error && (
          <Error error={addTier.error}>티어 추가에 실패했습니다</Error>
        )}
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
        <SecondaryButton onClick={handleClose} disabled={addTier.isPending}>
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={addTier.isPending || !isFormValid}
        >
          추가
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
