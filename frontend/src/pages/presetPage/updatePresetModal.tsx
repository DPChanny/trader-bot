import { useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { Modal, ModalFooter, ModalForm, ModalRow } from "@components/modal";
import { LabelInput } from "@components/molecules/labelInput";
import { PrimaryButton, SecondaryButton } from "@components/atoms/button";
import { Error } from "@components/molecules/error";
import { UpdatePresetSchema, type PresetDTO } from "@features/preset/dto";
import { buildPatchDTO } from "@utils/dto";
import { useUpdatePreset } from "@features/preset/hook";

interface UpdatePresetModalProps {
  preset: PresetDTO;
  onClose: () => void;
}

export function UpdatePresetModal({ preset, onClose }: UpdatePresetModalProps) {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const { presetId: presetIdStr } = useParams({ strict: false }) as {
    presetId: string;
  };
  const presetId = parseInt(presetIdStr, 10);
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
  const teamSizeNum = Number(teamSize) || 1;

  const handlePointScaleChange = (value: string) => {
    setPointScale(value);
    const newScale = Number(value) || 1;
    const current = Number(displayPoints);
    if (current > 0) {
      const rounded = Math.round(current / newScale) * newScale;
      const minAllowed = teamSizeNum * newScale;
      setDisplayPoints(String(Math.max(rounded, minAllowed)));
    }
  };

  const handleTeamSizeChange = (value: string) => {
    setTeamSize(value);
    const newTeamSize = Number(value) || 1;
    const storedPoints = Math.trunc(Number(displayPoints) / pointScaleNum);
    if (storedPoints < newTeamSize) {
      setDisplayPoints(
        String(Math.ceil(newTeamSize / pointScaleNum) * pointScaleNum),
      );
    }
  };
  const parseResult = UpdatePresetSchema.safeParse({
    name,
    points: Math.trunc(Number(displayPoints) / pointScaleNum),
    timer,
    teamSize,
    pointScale,
  });
  const isFormValid = parseResult.success;
  const patchDTO = parseResult.success
    ? buildPatchDTO(parseResult.data, preset)
    : null;
  const hasChanges = patchDTO !== null;
  const formId = "update-preset-form";

  const handleClose = () => {
    if (updatePreset.isPending) return;
    onClose();
  };

  const onSubmit = () => {
    if (updatePreset.isPending) return;
    if (!patchDTO) return;
    updatePreset.mutate(
      { guildId, presetId, dto: patchDTO },
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
          type="text"
          value={name}
          placeholder="1자 ~ 256자"
          maxLength={256}
          onValueChange={setName}
          autoFocus
          required
        />
        <ModalRow>
          <LabelInput
            label="포인트"
            type="number"
            value={displayPoints}
            placeholder={`${teamSizeNum * pointScaleNum} ~ ${10000 * pointScaleNum}`}
            min={teamSizeNum * pointScaleNum}
            max={10000 * pointScaleNum}
            step={pointScaleNum}
            onValueChange={setDisplayPoints}
            required
          />
          <LabelInput
            label="포인트 단위"
            type="number"
            value={pointScale}
            placeholder="1 ~ 100"
            min={1}
            max={100}
            onValueChange={handlePointScaleChange}
            required
          />
        </ModalRow>

        <ModalRow>
          <LabelInput
            label="타이머 (초)"
            type="number"
            value={timer}
            placeholder="5초 ~ 60초"
            min={5}
            max={60}
            onValueChange={setTimer}
            required
          />
          <LabelInput
            label="팀 크기"
            type="number"
            value={teamSize}
            placeholder="1명 ~ 10명"
            min={1}
            max={10}
            onValueChange={handleTeamSizeChange}
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
