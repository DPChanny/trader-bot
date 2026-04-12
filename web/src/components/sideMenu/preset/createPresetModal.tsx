import { useState } from "preact/hooks";
import {
  Modal,
  ModalForm,
  ModalFooter,
  ModalRow,
} from "@/components/commons/modal";
import { LabelInput } from "@/components/commons/labelInput";
import { PrimaryButton, SecondaryButton } from "@/components/commons/button";
import { Error as ErrorMessage } from "@/components/commons/error";

interface CreatePresetModalProps {
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    points: number;
    timer: number;
    teamSize: number;
    pointScale: number;
  }) => Promise<void>;
  isPending: boolean;
  error?: any;
}

export function CreatePresetModal({
  onClose,
  onSubmit,
  isPending,
  error,
}: CreatePresetModalProps) {
  const [presetName, setPresetName] = useState("");
  const [points, setPoints] = useState("");
  const [pointScale, setPointScale] = useState("");
  const [timer, setTimer] = useState("");
  const [teamSize, setTeamSize] = useState("");

  const handleClose = () => {
    if (isPending) return;
    setPresetName("");
    setPoints("");
    setPointScale("");
    setTimer("");
    setTeamSize("");
    onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!presetName.trim()) return;

    const parsedPoints = Math.max(0, Number(points) || 1000);
    const parsedPointScale = Math.max(1, Number(pointScale) || 5);
    const parsedTimer = Math.max(1, Number(timer) || 15);
    const parsedTeamSize = Math.max(1, Number(teamSize) || 5);

    try {
      await onSubmit({
        name: presetName.trim(),
        points: parsedPoints,
        timer: parsedTimer,
        teamSize: parsedTeamSize,
        pointScale: parsedPointScale,
      });
      handleClose();
    } catch {}
  };

  return (
    <Modal onClose={handleClose} title="프리셋 추가">
      <ModalForm onSubmit={handleSubmit}>
        {error ? (
          <ErrorMessage detail={error?.message}>
            프리셋 추가에 실패했습니다.
          </ErrorMessage>
        ) : null}
        <LabelInput
          label="프리셋 이름"
          type="text"
          value={presetName}
          onChange={setPresetName}
        />
        <ModalRow>
          <LabelInput
            label="포인트"
            type="number"
            value={points}
            placeholder="1000"
            onChange={setPoints}
          />
          <LabelInput
            label="포인트 스케일"
            type="number"
            value={pointScale}
            placeholder="5"
            onChange={setPointScale}
          />
        </ModalRow>
        <ModalRow>
          <LabelInput
            label="경매 타이머 (초)"
            type="number"
            value={timer}
            placeholder="15"
            onChange={setTimer}
          />
          <LabelInput
            label="팀당 인원수"
            type="number"
            value={teamSize}
            placeholder="5"
            onChange={setTeamSize}
          />
        </ModalRow>
        <ModalFooter>
          <SecondaryButton onClick={handleClose} disabled={isPending}>
            취소
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={isPending || !presetName.trim()}
          >
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
