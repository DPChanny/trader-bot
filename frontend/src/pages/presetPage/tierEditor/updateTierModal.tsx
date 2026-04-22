import { useEffect, useState } from "preact/hooks";
import { useGuildId, usePresetId } from "@hooks/router";
import { Modal, ModalFooter, ModalForm } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { UpdateTierSchema, type TierDTO } from "@features/tier/dto";
import { buildPatchDTO } from "@utils/dto";
import { useUpdateTier } from "@features/tier/hook";

interface UpdateTierModalProps {
  tier: TierDTO;
  onClose: () => void;
}

export function UpdateTierModal({ tier, onClose }: UpdateTierModalProps) {
  const guildId = useGuildId();
  const presetId = usePresetId();
  const [name, setName] = useState(tier.name);
  const [iconUrl, setIconUrl] = useState(tier.iconUrl ?? "");
  const updateTier = useUpdateTier();

  useEffect(() => {
    setName(tier.name);
    setIconUrl(tier.iconUrl ?? "");
  }, [tier.tierId, tier.name, tier.iconUrl]);

  const parseResult = UpdateTierSchema.safeParse({ name, iconUrl });
  const isFormValid = parseResult.success;
  const patchDTO = parseResult.success
    ? buildPatchDTO(parseResult.data, tier)
    : null;
  const hasChanges = patchDTO !== null;
  const formId = "update-tier-form";

  const handleClose = () => {
    if (updateTier.isPending) return;
    onClose();
  };

  const onSubmit = () => {
    if (updateTier.isPending) return;
    if (!patchDTO) return;
    updateTier.mutate(
      { guildId, presetId, tierId: tier.tierId, dto: patchDTO },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal onClose={handleClose} title="티어 수정">
      <ModalForm
        id={formId}
        onSubmit={onSubmit}
        disabled={updateTier.isPending}
      >
        {updateTier.error && (
          <Error error={updateTier.error}>티어 수정에 실패했습니다</Error>
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

