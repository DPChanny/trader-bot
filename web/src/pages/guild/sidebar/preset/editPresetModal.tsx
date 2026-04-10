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

interface EditPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    points: number,
    timer: number,
    teamSize: number,
    pointScale: number,
  ) => void;
  presetId: number | null;
  name: string;
  points: number;
  timer: number;
  teamSize: number;
  pointScale: number;
  isPending?: boolean;
  error?: any;
}

export function EditPresetModal({
  isOpen,
  onClose,
  onSubmit,
  name: propName,
  points: propPoints,
  timer: propTimer,
  teamSize: propTeamSize,
  pointScale: propPointScale,
  isPending = false,
  error,
}: EditPresetModalProps) {
  const [name, setName] = useState(propName);
  const [inputPoints, setInputPoints] = useState(propPoints * propPointScale);
  const [timer, setTimer] = useState(propTimer);
  const [teamSize, setTeamSize] = useState(propTeamSize);
  const [pointScale, setPointScale] = useState(propPointScale);

  useEffect(() => {
    if (isOpen) {
      setName(propName);
      setInputPoints(propPoints * propPointScale);
      setTimer(propTimer);
      setTeamSize(propTeamSize);
      setPointScale(propPointScale);
    }
  }, [isOpen, propName, propPoints, propTimer, propTeamSize, propPointScale]);

  const isDivisible = inputPoints % pointScale === 0;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim() || pointScale <= 0 || !isDivisible) return;
    const actualPoints = inputPoints / pointScale;
    onSubmit(name.trim(), actualPoints, timer, teamSize, pointScale);
  };

  const hasChanges =
    name !== propName ||
    inputPoints !== propPoints * propPointScale ||
    timer !== propTimer ||
    teamSize !== propTeamSize ||
    pointScale !== propPointScale;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="프리셋 수정">
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
              value={inputPoints.toString()}
              onChange={(value) => setInputPoints(Number(value) || 0)}
              variantIntent={isDivisible ? "default" : "error"}
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
          {!isDivisible && (
            <Error>포인트는 포인트 스케일로 나뉘어떨어져야 합니다.</Error>
          )}
        </div>

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

        <ModalFooter>
          <SecondaryButton type="button" onClick={onClose}>
            취소
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isPending || !name.trim() || !hasChanges || !isDivisible}
          >
            저장
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
