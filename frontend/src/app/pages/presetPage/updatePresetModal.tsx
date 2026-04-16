import { useEffect, useState } from "preact/hooks";
import { useGuildId, usePresetId } from "@hooks/router";
import { Modal, ModalFooter, ModalForm, ModalRow } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { UpdatePresetSchema, type PresetDTO } from "@dtos/preset";
import { buildPatchDto } from "@utils/dto";
import { useUpdatePreset } from "@hooks/preset";

interface UpdatePresetModalProps {
  preset: PresetDTO;
  onClose: () => void;
}

export function UpdatePresetModal({ preset, onClose }: UpdatePresetModalProps) {
  const guildId = useGuildId();
  const presetId = usePresetId();
  const [name, setName] = useState(preset.name);
  const [displayPoints, setDisplayPoints] = useState(
    String(preset.points * preset.pointScale),
  );
  const [timer, setTimer] = useState(String(preset.timer));
  const [teamSize, setTeamSize] = useState(String(preset.teamSize));
  const [pointScale, setPointScale] = useState(String(preset.pointScale));
  const updatePreset = useUpdatePreset();

  useEffect(() => {
    setName(preset.name);
    setDisplayPoints(String(preset.points * preset.pointScale));
    setTimer(String(preset.timer));
    setTeamSize(String(preset.teamSize));
    setPointScale(String(preset.pointScale));
  }, [
    preset.presetId,
    preset.name,
    preset.points,
    preset.timer,
    preset.teamSize,
    preset.pointScale,
  ]);

  const pointScaleNum = Number(pointScale) || 1;
  const parseResult = UpdatePresetSchema.safeParse({
    name,
    points: Math.trunc(Number(displayPoints) / pointScaleNum),
    timer,
    teamSize,
    pointScale,
  });
  const isFormValid = parseResult.success;
  const patchDto = parseResult.success
    ? buildPatchDto(parseResult.data, preset)
    : null;
  const hasChanges = patchDto !== null;
  const formId = "update-preset-form";

  const handleClose = () => {
    if (updatePreset.isPending) return;
    onClose();
  };

  const onSubmit = () => {
    if (updatePreset.isPending) return;
    if (!patchDto) return;
    updatePreset.mutate(
      { guildId, presetId, dto: patchDto },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal onClose={handleClose} title="프리셋 수정">
      <ModalForm
        id={formId}
        onSubmit={onSubmit}
        disabled={updatePreset.isPending}
      >
        {updatePreset.error && (
          <Error error={updatePreset.error}>프리셋 수정에 실패했습니다</Error>
        )}
        <LabelInput
          label="프리셋 이름"
          value={name}
          onValueChange={setName}
          autoFocus
          required
        />
        <ModalRow>
          <LabelInput
            label="포인트"
            type="number"
            value={displayPoints}
            onValueChange={setDisplayPoints}
            required
          />
          <LabelInput
            label="포인트 단위"
            type="number"
            value={pointScale}
            onValueChange={setPointScale}
            required
          />
        </ModalRow>

        <ModalRow>
          <LabelInput
            label="타이머 (초)"
            type="number"
            value={timer}
            onValueChange={setTimer}
            required
          />
          <LabelInput
            label="팀 크기"
            type="number"
            value={teamSize}
            onValueChange={setTeamSize}
            required
          />
        </ModalRow>
      </ModalForm>
      <ModalFooter>
        <SecondaryButton
          onClick={handleClose}
          disabled={updatePreset.isPending}
        >
          취소
        </SecondaryButton>
        <PrimaryButton
          type="submit"
          form={formId}
          disabled={updatePreset.isPending || !hasChanges || !isFormValid}
        >
          저장
        </PrimaryButton>
      </ModalFooter>
    </Modal>
  );
}
