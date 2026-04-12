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
import type { PresetDTO, UpdatePresetDTO } from "@/dtos/presetDto";
import { hasPatchFields } from "@/utils/hook";
import {
  PRESET_DISPLAY_POINTS_MAX,
  PRESET_POINT_SCALE_MAX,
  PRESET_POINT_SCALE_MIN,
  PRESET_POINTS_MAX,
  PRESET_POINTS_MIN,
  PRESET_TEAM_SIZE_MAX,
  PRESET_TEAM_SIZE_MIN,
  PRESET_TIMER_MAX,
  PRESET_TIMER_MIN,
  isPresetFormValid,
  normalizePresetName,
  sanitizePresetInteger,
  toDisplayPoints,
  toStoredPoints,
} from "@/utils/presetValidation";

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
    toDisplayPoints(preset.points, preset.pointScale),
  );
  const [timer, setTimer] = useState(preset.timer);
  const [teamSize, setTeamSize] = useState(preset.teamSize);
  const [pointScale, setPointScale] = useState(preset.pointScale);

  useEffect(() => {
    setName(preset.name);
    setDisplayPoints(toDisplayPoints(preset.points, preset.pointScale));
    setTimer(preset.timer);
    setTeamSize(preset.teamSize);
    setPointScale(preset.pointScale);
  }, [
    preset.presetId,
    preset.name,
    preset.points,
    preset.timer,
    preset.teamSize,
    preset.pointScale,
  ]);

  const normalizedName = normalizePresetName(name);
  const points = Math.min(
    PRESET_POINTS_MAX,
    Math.max(
      PRESET_POINTS_MIN,
      toStoredPoints(
        displayPoints,
        Math.max(pointScale, PRESET_POINT_SCALE_MIN),
      ),
    ),
  );
  const isFormValid = isPresetFormValid({
    name: normalizedName,
    points,
    pointScale,
    timer,
    teamSize,
  });

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!isFormValid) return;

    const dto: UpdatePresetDTO = {};
    if (normalizedName !== preset.name) dto.name = normalizedName;
    if (points !== preset.points) dto.points = points;
    if (timer !== preset.timer) dto.timer = timer;
    if (teamSize !== preset.teamSize) dto.teamSize = teamSize;
    if (pointScale !== preset.pointScale) dto.pointScale = pointScale;

    if (!hasPatchFields(dto)) return;
    onSubmit(dto);
  };

  const hasChanges =
    normalizedName !== preset.name ||
    points !== preset.points ||
    timer !== preset.timer ||
    teamSize !== preset.teamSize ||
    pointScale !== preset.pointScale;

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
            value={displayPoints.toString()}
            onChange={(value) =>
              setDisplayPoints(
                sanitizePresetInteger(
                  value,
                  displayPoints,
                  PRESET_POINTS_MIN,
                  PRESET_DISPLAY_POINTS_MAX,
                ),
              )
            }
          />
          <LabelInput
            label="포인트 스케일"
            type="number"
            value={pointScale.toString()}
            onChange={(value) =>
              setPointScale(
                sanitizePresetInteger(
                  value,
                  pointScale,
                  PRESET_POINT_SCALE_MIN,
                  PRESET_POINT_SCALE_MAX,
                ),
              )
            }
          />
        </ModalRow>

        <ModalRow>
          <LabelInput
            label="타이머 (초)"
            type="number"
            value={timer.toString()}
            onChange={(value) =>
              setTimer(
                sanitizePresetInteger(
                  value,
                  timer,
                  PRESET_TIMER_MIN,
                  PRESET_TIMER_MAX,
                ),
              )
            }
          />
          <LabelInput
            label="팀당 인원수"
            type="number"
            value={teamSize.toString()}
            onChange={(value) =>
              setTeamSize(
                sanitizePresetInteger(
                  value,
                  teamSize,
                  PRESET_TEAM_SIZE_MIN,
                  PRESET_TEAM_SIZE_MAX,
                ),
              )
            }
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
