import { useEffect, useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";
import {
  UpdateTierSchema,
  type TierDTO,
  type UpdateTierDTO,
} from "@/dtos/tier";
import { buildPatchDto } from "@/utils/dto";

interface UpdateTierModalProps {
  tier: TierDTO;
  onClose: () => void;
  onSubmit: (dto: UpdateTierDTO) => void;
  isPending: boolean;
  error?: any;
}

export function UpdateTierModal({
  tier,
  onClose,
  onSubmit,
  isPending,
  error,
}: UpdateTierModalProps) {
  const [name, setName] = useState(tier.name);
  const [iconUrl, setIconUrl] = useState(tier.iconUrl ?? "");

  useEffect(() => {
    setName(tier.name);
    setIconUrl(tier.iconUrl ?? "");
  }, [tier.tierId, tier.name, tier.iconUrl]);

  const parseResult = UpdateTierSchema.safeParse({ name, iconUrl });
  const isFormValid = parseResult.success;
  const patchDto = parseResult.success
    ? buildPatchDto(parseResult.data, tier)
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
    <Modal onClose={handleClose} title="티어 수정">
      <ModalForm onSubmit={handleSubmit}>
        {error ? (
          <ErrorMessage error={error}>티어 수정에 실패했습니다.</ErrorMessage>
        ) : null}
        <LabelInput
          label="티어 이름"
          type="text"
          value={name}
          onChange={setName}
          required
        />
        <LabelInput
          label="아이콘 링크"
          type="text"
          value={iconUrl}
          onChange={setIconUrl}
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
