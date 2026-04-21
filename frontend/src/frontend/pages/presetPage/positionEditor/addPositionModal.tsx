import { useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { AddPositionSchema } from "@dtos/position";
import { useGuildId, usePresetId } from "@hooks/router";
import { useAddPosition } from "@hooks/position";

interface AddPositionModalProps {
  onClose: () => void;
}

export function AddPositionModal({ onClose }: AddPositionModalProps) {
  const guildId = useGuildId();
  const presetId = usePresetId();
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

  const onSubmit = () => {
    if (addPosition.isPending) return;
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
      <ModalForm
        id={formId}
        onSubmit={onSubmit}
        disabled={addPosition.isPending}
      >
        {addPosition.error && (
          <Error error={addPosition.error}>포지션 추가에 실패했습니다</Error>
        )}
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
