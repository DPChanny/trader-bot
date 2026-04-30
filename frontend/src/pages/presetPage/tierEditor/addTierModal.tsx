import { useParams } from "@tanstack/react-router";
import { useState } from "react";

import { Modal, ModalForm, ModalFooter } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { AddTierSchema } from "@features/tier/dto";
import { useAddTier } from "@features/tier/hook";

interface AddTierModalProps {
  onClose: () => void;
}

export function AddTierModal({ onClose }: AddTierModalProps) {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const { presetId: presetIdStr } = useParams({ strict: false }) as {
    presetId: string;
  };
  const presetId = parseInt(presetIdStr, 10);
  const [name, setName] = useState("");
  const [iconUrl, setIconUrl] = useState("");
  const addTier = useAddTier();
  const parseResult = AddTierSchema.safeParse({ name, iconUrl });
  const isFormValid = parseResult.success;
  const formId = "add-tier-form";

  const handleClose = () => {
    if (addTier.isPending) return;
    setName("");
    setIconUrl("");
    onClose();
  };

  const onSubmit = () => {
    if (addTier.isPending) return;
    if (!parseResult.success) return;
    addTier.mutate(
      { guildId, presetId, dto: parseResult.data },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal onClose={handleClose} title="티어 추가">
      <ModalForm id={formId} onSubmit={onSubmit} disabled={addTier.isPending}>
        {addTier.error && (
          <Error error={addTier.error}>티어 추가에 실패했습니다</Error>
        )}
        <LabelInput
          label="티어 이름"
          type="text"
          value={name}
          placeholder="1자 ~ 256자"
          maxLength={256}
          onValueChange={setName}
          required
        />
        <LabelInput
          label="아이콘 링크"
          type="text"
          value={iconUrl}
          placeholder="최대 2048자"
          maxLength={2048}
          onValueChange={setIconUrl}
        />
      </ModalForm>
      <ModalFooter>
        <SecondaryButton onClick={handleClose} disabled={addTier.isPending}>
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={addTier.isPending || !isFormValid}
        >
          추가
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
