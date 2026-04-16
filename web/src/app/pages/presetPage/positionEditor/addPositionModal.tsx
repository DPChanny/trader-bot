import { useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { AddPositionSchema } from "@dtos/position";
import { useAddPosition } from "@hooks/position";

interface AddPositionModalProps {
  guildId: string;
  presetId: number;
  onClose: () => void;
}

export function AddPositionModal({
  guildId,
  presetId,
  onClose,
}: AddPositionModalProps) {
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const addPosition = useAddPosition();
  const parseResult = AddPositionSchema.safeParse({ name, iconUrl });
  const isFormValid = parseResult.success;
  const formId = "add-position-form";

  const handleClose = () => {
    if (addPosition.isPending) return;
    setName("");
    setIconUrl("");
    onClose();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!parseResult.success) return;
    addPosition.mutate(
      {
        guildId,
        presetId,
        dto: parseResult.data,
      },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal onClose={handleClose} title="포지션 추가">
      <ModalForm id={formId} onSubmit={handleSubmit}>
        {addPosition.error && <Error error={addPosition.error} />}
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
        <SecondaryButton onClick={handleClose} disabled={addPosition.isPending}>
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={addPosition.isPending || !isFormValid}
        >
          추가
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
