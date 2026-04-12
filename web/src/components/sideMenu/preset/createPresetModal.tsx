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

const INITIAL_STATE = {
  presetName: "",
  points: 1000,
  pointScale: 1,
  timer: 30,
  teamSize: 5,
};

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
  const [presetName, setPresetName] = useState(INITIAL_STATE.presetName);
  const [points, setPoints] = useState(INITIAL_STATE.points);
  const [pointScale, setPointScale] = useState(INITIAL_STATE.pointScale);
  const [timer, setTimer] = useState(INITIAL_STATE.timer);
  const [teamSize, setTeamSize] = useState(INITIAL_STATE.teamSize);

  const handleClose = () => {
    if (isPending) return;
    setPresetName(INITIAL_STATE.presetName);
    setPoints(INITIAL_STATE.points);
    setPointScale(INITIAL_STATE.pointScale);
    setTimer(INITIAL_STATE.timer);
    setTeamSize(INITIAL_STATE.teamSize);
    onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!presetName.trim() || pointScale <= 0 || points < 0) return;
    try {
      await onSubmit({
        name: presetName.trim(),
        points,
        timer,
        teamSize,
        pointScale,
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
            value={points.toString()}
            onChange={(v) => setPoints(Math.max(0, Number(v) || 0))}
          />
          <LabelInput
            label="포인트 스케일"
            type="number"
            value={pointScale.toString()}
            onChange={(v) => setPointScale(parseInt(v) || 1)}
          />
        </ModalRow>
        <ModalRow>
          <LabelInput
            label="경매 타이머 (초)"
            type="number"
            value={timer.toString()}
            onChange={(v) => setTimer(parseInt(v) || 30)}
          />
          <LabelInput
            label="팀당 인원수"
            type="number"
            value={teamSize.toString()}
            onChange={(v) => setTeamSize(parseInt(v) || 5)}
          />
        </ModalRow>
        <ModalFooter>
          <SecondaryButton onClick={handleClose} disabled={isPending}>
            취소
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={
              isPending || !presetName.trim() || pointScale <= 0 || points < 0
            }
          >
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
