import { useEffect, useState } from "preact/hooks";
import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { UpdateTierSchema, type TierDTO } from "@dtos/tier";
import { buildPatchDto } from "@utils/dto";
import { useUpdateTier } from "@hooks/tier";

interface UpdateTierModalProps {
  guildId: string;
  presetId: number;
  tier: TierDTO;
  onClose: () => void;
}

export function UpdateTierModal({
  guildId,
  presetId,
  tier,
  onClose,
}: UpdateTierModalProps) {
  const [name, setName] = useState(tier.name);
  const [iconUrl, setIconUrl] = useState(tier.iconUrl ?? "");
  const updateTier = useUpdateTier();

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
  const formId = "update-tier-form";

  const handleClose = () => {
    if (updateTier.isPending) return;
    onClose();
  };

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!patchDto) return;
    updateTier.mutate(
      { guildId, presetId, tierId: tier.tierId, dto: patchDto },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal onClose={handleClose} title="티어 수정">
      <ModalForm id={formId} onSubmit={handleSubmit}>
        {updateTier.error && <Error error={updateTier.error} />}
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
        <SecondaryButton onClick={handleClose} disabled={updateTier.isPending}>
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={updateTier.isPending || !isFormValid || !hasChanges}
        >
          저장
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
