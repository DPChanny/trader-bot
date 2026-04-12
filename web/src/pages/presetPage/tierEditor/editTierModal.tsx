import { useEffect, useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";
import type { TierDTO, UpdateTierDTO } from "@/dtos/tierDto";
import { hasPatchFields, normalizeNullableText } from "@/utils/hook";

interface EditTierModalProps {
  tier: TierDTO;
  onClose: () => void;
  onSubmit: (dto: UpdateTierDTO) => void;
  isPending: boolean;
  error?: any;
}

export function EditTierModal({
  tier,
  onClose,
  onSubmit,
  isPending,
  error,
}: EditTierModalProps) {
  const [name, setName] = useState(tier.name);
  const [iconUrl, setIconUrl] = useState(tier.iconUrl ?? "");

  useEffect(() => {
    setName(tier.name);
    setIconUrl(tier.iconUrl ?? "");
  }, [tier.tierId, tier.name, tier.iconUrl]);

  const normalizedName = name.trim();
  const normalizedIconUrl = iconUrl.trim();
  const hasChanges =
    normalizedName !== tier.name ||
    (normalizedIconUrl.length > 0 ? normalizedIconUrl : null) !== tier.iconUrl;

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (!hasChanges) return;

    const dto: UpdateTierDTO = {};
    const iconUrl = normalizeNullableText(normalizedIconUrl);
    if (normalizedName !== tier.name) dto.name = normalizedName;
    if (iconUrl !== tier.iconUrl) dto.iconUrl = iconUrl;

    if (!hasPatchFields(dto)) return;
    onSubmit(dto);
  };

  return (
    <Modal onClose={handleClose} title="티어 수정">
      <ModalForm onSubmit={handleSubmit}>
        {error ? (
          <ErrorMessage detail={error?.message}>
            티어 수정에 실패했습니다.
          </ErrorMessage>
        ) : null}
        <LabelInput
          label="티어 이름"
          type="text"
          value={name}
          onChange={setName}
        />
        <LabelInput
          label="아이콘 URL (선택사항)"
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
            disabled={isPending || !name.trim() || !hasChanges}
          >
            저장
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
