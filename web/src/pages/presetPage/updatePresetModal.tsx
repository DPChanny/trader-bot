import { useEffect, useState } from "preact/hooks";
import {
  Modal,
  ModalFooter,
  ModalForm,
  ModalRow,
} from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error } from "@/components/commons/error";
import {
  UpdatePresetSchema,
  type PresetDTO,
  type UpdatePresetDTO,
} from "@/dtos/presetDto";
import { buildPatchDto } from "@/utils/dto";

interface UpdatePresetModalProps {
  preset: PresetDTO;
  onClose: () => void;
  onSubmit: (dto: UpdatePresetDTO) => void;
  isPending: boolean;
  error?: any;
}

export function UpdatePresetModal({
  preset,
  onClose,
  onSubmit,
  isPending,
  error,
}: UpdatePresetModalProps) {
  const [name, setName] = useState(preset.name);
  const [displayPoints, setDisplayPoints] = useState(
    String(preset.points * preset.pointScale),
  );
  const [timer, setTimer] = useState(String(preset.timer));
  const [teamSize, setTeamSize] = useState(String(preset.teamSize));
  const [pointScale, setPointScale] = useState(String(preset.pointScale));

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

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!patchDto) return;
    onSubmit(patchDto);
  };

  const handleClose = () => {
    if (isPending) return;
    onClose();
  };

  return (
    <Modal onClose={handleClose} title="프리셋 수정">
      <ModalForm onSubmit={handleSubmit}>
        {error && (
          <Error detail={error?.message}>프리셋 수정에 실패했습니다.</Error>
        )}
        <LabelInput
          label="프리셋 이름"
          value={name}
          onChange={setName}
          autoFocus
        />
        <ModalRow>
          <LabelInput
            label="포인트"
            type="number"
            value={displayPoints}
            onChange={setDisplayPoints}
          />
          <LabelInput
            label="포인트 스케일"
            type="number"
            value={pointScale}
            onChange={setPointScale}
          />
        </ModalRow>

        <ModalRow>
          <LabelInput
            label="타이머 (초)"
            type="number"
            value={timer}
            onChange={setTimer}
          />
          <LabelInput
            label="팀당 인원수"
            type="number"
            value={teamSize}
            onChange={setTeamSize}
          />
        </ModalRow>

        <ModalFooter>
          <SecondaryButton
            type="button"
            onClick={handleClose}
            disabled={isPending}
          >
            취소
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isPending || !hasChanges || !isFormValid}
          >
            저장
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
