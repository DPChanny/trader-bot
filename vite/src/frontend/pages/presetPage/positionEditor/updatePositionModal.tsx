import { useEffect, useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { UpdatePositionSchema, type PositionDTO } from "@dtos/position";
import { useGuildId, usePresetId } from "@hooks/router";
import { buildPatchDTO } from "@utils/dto";
import { useUpdatePosition } from "@hooks/position";

interface UpdatePositionModalProps {
  position: PositionDTO;
  onClose: () => void;
}

export function UpdatePositionModal({
  position,
  onClose,
}: UpdatePositionModalProps) {
  const guildId = useGuildId();
  const presetId = usePresetId();
  const [name, setName] = useState(position.name);
  const [iconUrl, setIconUrl] = useState(position.iconUrl ?? "");
  const updatePosition = useUpdatePosition();

  useEffect(() => {
    setName(position.name);
    setIconUrl(position.iconUrl ?? "");
  }, [position.positionId, position.name, position.iconUrl]);

  const parseResult = UpdatePositionSchema.safeParse({ name, iconUrl });
  const isFormValid = parseResult.success;
  const patchDTO = parseResult.success
    ? buildPatchDTO(parseResult.data, position)
    : null;
  const hasChanges = patchDTO !== null;
  const formId = "update-position-form";

  const handleClose = () => {
    if (updatePosition.isPending) return;
    onClose();
  };

  const onSubmit = () => {
    if (updatePosition.isPending) return;
    if (!patchDTO) return;
    updatePosition.mutate(
      { guildId, presetId, positionId: position.positionId, dto: patchDTO },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal onClose={handleClose} title="포지션 수정">
      <ModalForm
        id={formId}
        onSubmit={onSubmit}
        disabled={updatePosition.isPending}
      >
        {updatePosition.error && (
          <Error error={updatePosition.error}>포지션 수정에 실패했습니다</Error>
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
        <SecondaryButton
          onClick={handleClose}
          disabled={updatePosition.isPending}
        >
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={updatePosition.isPending || !isFormValid || !hasChanges}
        >
          저장
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
