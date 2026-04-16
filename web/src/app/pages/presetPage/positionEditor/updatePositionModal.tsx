import { useEffect, useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import {
  UpdatePositionSchema,
  type PositionDTO,
  type UpdatePositionDTO,
} from "@dtos/position";
import { buildPatchDto } from "@utils/dto";

interface UpdatePositionModalProps {
  position: PositionDTO;
  onClose: () => void;
  onSubmit: (dto: UpdatePositionDTO) => void | Promise<void>;
  isPending: boolean;
  error?: any;
}

export function UpdatePositionModal({
  position,
  onClose,
  onSubmit,
  isPending,
  error,
}: UpdatePositionModalProps) {
  const [name, setName] = useState(position.name);
  const [iconUrl, setIconUrl] = useState(position.iconUrl ?? "");

  useEffect(() => {
    setName(position.name);
    setIconUrl(position.iconUrl ?? "");
  }, [position.positionId, position.name, position.iconUrl]);

  const parseResult = UpdatePositionSchema.safeParse({ name, iconUrl });
  const isFormValid = parseResult.success;
  const patchDto = parseResult.success
    ? buildPatchDto(parseResult.data, position)
    : null;
  const hasChanges = patchDto !== null;
  const formId = "update-position-form";

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!patchDto) return;
    onSubmit(patchDto);
  };

  return (
    <Modal onClose={handleClose} title="포지션 수정">
      <ModalForm id={formId} onSubmit={handleSubmit}>
        {error ? <Error error={error} /> : null}
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
          disabled={isPending || !isFormValid || !hasChanges}
        >
          저장
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
