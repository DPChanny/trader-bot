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
import type { PresetDTO } from "@/dtos/presetDto";

interface EditPresetModalProps {
  preset: PresetDTO;
  onClose: () => void;
  onSubmit: (
    name: string,
    points: number,
    timer: number,
    teamSize: number,
    pointScale: number,
  ) => void;
  isPending: boolean;
  error?: any;
}

export function EditPresetModal({
  preset,
  onClose,
  onSubmit,
  isPending,
  error,
}: EditPresetModalProps) {
  const [name, setName] = useState(preset.name);
  const [points, setPoints] = useState(preset.points);
  const [timer, setTimer] = useState(preset.timer);
  const [teamSize, setTeamSize] = useState(preset.teamSize);
  const [pointScale, setPointScale] = useState(preset.pointScale);

  useEffect(() => {
    setName(preset.name);
    setPoints(preset.points);
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

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim() || pointScale <= 0 || points < 0) return;
    onSubmit(name.trim(), points, timer, teamSize, pointScale);
  };

  const hasChanges =
    name !== preset.name ||
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
          onChange={(value) => setName(value)}
          autoFocus
        />
        <div>
          <ModalRow>
            <LabelInput
              label="포인트"
              type="number"
              value={points.toString()}
              onChange={(value) => setPoints(Math.max(0, Number(value) || 0))}
            />
            <LabelInput
              label="포인트 스케일"
              type="number"
              value={pointScale.toString()}
              onChange={(value) =>
                setPointScale(Math.max(1, Number(value) || 1))
              }
            />
          </ModalRow>
        </div>

        <ModalRow>
          <LabelInput
            label="타이머 (초)"
            type="number"
            value={timer.toString()}
            onChange={(value) => setTimer(Number(value) || 0)}
          />
          <LabelInput
            label="팀당 인원수"
            type="number"
            value={teamSize.toString()}
            onChange={(value) => setTeamSize(Math.max(1, Number(value) || 1))}
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
            disabled={isPending || !name.trim() || !hasChanges || points < 0}
          >
            저장
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
