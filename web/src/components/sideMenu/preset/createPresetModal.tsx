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
import { CreatePresetSchema, type CreatePresetDTO } from "@/dtos/preset";

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

  const pointScaleNum = Number(pointScale) || 1;
  const parseResult = CreatePresetSchema.safeParse({
    name,
    points: Math.trunc(Number(points) / pointScaleNum),
    timer,
    teamSize,
    pointScale,
  });
  const isFormValid = parseResult.success;

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
    if (!parseResult.success) return;
    try {
      await onSubmit(parseResult.data);
      handleClose();
    } catch {}
  };

  return (
    <Modal onClose={handleClose} title="프리셋 추가">
      <ModalForm onSubmit={handleSubmit}>
        {error ? (
          <ErrorMessage error={error}>프리셋 추가에 실패했습니다.</ErrorMessage>
        ) : null}
        <LabelInput
          label="프리셋 이름"
          type="text"
          value={name}
          onChange={setName}
          required
        />
        <ModalRow>
          <LabelInput
            label="포인트"
            type="number"
            value={points}
            placeholder="1000"
            onChange={setPoints}
            required
          />
          <LabelInput
            label="포인트 스케일"
            type="number"
            value={pointScale}
            placeholder="5"
            onChange={setPointScale}
            required
          />
        </ModalRow>
        <ModalRow>
          <LabelInput
            label="경매 타이머 (초)"
            type="number"
            value={timer}
            placeholder="15"
            onChange={setTimer}
            required
          />
          <LabelInput
            label="팀 크기"
            type="number"
            value={teamSize}
            placeholder="5"
            onChange={setTeamSize}
            required
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
