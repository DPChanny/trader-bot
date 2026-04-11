import { useEffect, useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";
import type { TierDTO } from "@/dtos/tierDto";

interface EditTierModalProps {
  tier: TierDTO;
  onClose: () => void;
  onSubmit: (name: string, iconUrl: string | null) => void;
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

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), iconUrl.trim() || null);
  };

  return (
    <Modal onClose={onClose} title="티어 수정">
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
          <SecondaryButton onClick={onClose}>취소</SecondaryButton>
          <PrimaryButton type="submit" disabled={isPending || !name.trim()}>
            저장
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
