import { useEffect, useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@/components/molecules/modal";
import { LabelInput } from "@/components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/atoms/button";
import { ErrorMessage } from "@/components/molecules/errorMessage";
import {
  UpdatePositionSchema,
  type PositionDTO,
  type UpdatePositionDTO,
} from "@/dtos/position";
import { buildPatchDto } from "@/utils/dto";

interface UpdatePositionModalProps {
  position: PositionDTO;
  onClose: () => void;
  onSubmit: (dto: UpdatePositionDTO) => void;
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
      <ModalForm onSubmit={handleSubmit}>
        {error ? (
          <ErrorMessage error={error}>포지션 수정에 실패했습니다.</ErrorMessage>
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
          <PrimaryButton
            type="submit"
            disabled={isPending || !isFormValid || !hasChanges}
          >
            저장
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
