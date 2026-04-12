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
import type { CreatePresetDTO } from "@/dtos/presetDto";
import {
  isPresetFormValid,
  normalizeCreatePresetValues,
} from "@/utils/presetValidation";

interface CreatePresetModalProps {
  onClose: () => void;
  onSubmit: (dto: CreatePresetDTO) => Promise<void>;
  isPending: boolean;
  error?: any;
}

export function CreatePresetModal({
  onClose,
  onSubmit,
  isPending,
  error,
}: CreatePresetModalProps) {
  const [name, setName] = useState("");
  const [points, setPoints] = useState("");
  const [pointScale, setPointScale] = useState("");
  const [timer, setTimer] = useState("");
  const [teamSize, setTeamSize] = useState("");

  const normalizedValues = normalizeCreatePresetValues({
    name,
    points,
    pointScale,
    timer,
    teamSize,
  });
  const isFormValid = isPresetFormValid(normalizedValues);

  const handleClose = () => {
    if (isPending) return;
    setName("");
    setPoints("");
    setPointScale("");
    setTimer("");
    setTeamSize("");
    onClose();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!isFormValid) return;

    const dto: CreatePresetDTO = {
      name: normalizedValues.name,
      points: normalizedValues.points,
      timer: normalizedValues.timer,
      teamSize: normalizedValues.teamSize,
      pointScale: normalizedValues.pointScale,
    };

    try {
      await onSubmit(dto);
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
          value={name}
          onChange={setName}
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
          <PrimaryButton type="submit" disabled={isPending || !isFormValid}>
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
