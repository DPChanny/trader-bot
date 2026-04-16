import { useState } from "preact/hooks";
import { Modal, ModalForm, ModalFooter, ModalRow } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { CreatePresetSchema } from "@dtos/preset";
import { useCreatePreset } from "@hooks/preset";

interface CreatePresetModalProps {
  guildId: string;
  onClose: () => void;
}

export function CreatePresetModal({
  guildId,
  onClose,
}: CreatePresetModalProps) {
  const [name, setName] = useState("");
  const [points, setPoints] = useState("");
  const [pointScale, setPointScale] = useState("");
  const [timer, setTimer] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const createPreset = useCreatePreset();

  const pointScaleNum = Number(pointScale) || 1;
  const parseResult = CreatePresetSchema.safeParse({
    name,
    points: Math.trunc(Number(points) / pointScaleNum),
    timer,
    teamSize,
    pointScale,
  });
  const isFormValid = parseResult.success;
  const formId = "create-preset-form";

  const handleClose = () => {
    if (createPreset.isPending) return;
    setName("");
    setPoints("");
    setPointScale("");
    setTimer("");
    setTeamSize("");
    onClose();
  };

  const onSubmit = () => {
    if (createPreset.isPending) return;
    if (!parseResult.success) return;
    createPreset.mutate(
      { guildId, dto: parseResult.data },
      { onSuccess: handleClose },
    );
  };

  return (
    <Modal onClose={handleClose} title="프리셋 생성">
      <ModalForm
        id={formId}
        onSubmit={onSubmit}
        disabled={createPreset.isPending}
      >
        {createPreset.error && (
          <Error error={createPreset.error}>프리셋 생성에 실패했습니다</Error>
        )}
        <LabelInput
          label="프리셋 이름"
          type="text"
          value={name}
          onValueChange={setName}
          required
        />
        <ModalRow>
          <LabelInput
            label="포인트"
            type="number"
            value={points}
            placeholder="1000"
            onValueChange={setPoints}
            required
          />
          <LabelInput
            label="포인트 단위"
            type="number"
            value={pointScale}
            placeholder="5"
            onValueChange={setPointScale}
            required
          />
        </ModalRow>
        <ModalRow>
          <LabelInput
            label="타이머 (초)"
            type="number"
            value={timer}
            placeholder="15"
            onValueChange={setTimer}
            required
          />
          <LabelInput
            label="팀 크기"
            type="number"
            value={teamSize}
            placeholder="5"
            onValueChange={setTeamSize}
            required
          />
        </ModalRow>
      </ModalForm>
      <ModalFooter>
        <SecondaryButton
          onClick={handleClose}
          disabled={createPreset.isPending}
        >
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={createPreset.isPending || !isFormValid}
        >
          생성
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
