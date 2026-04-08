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
import { Toggle } from "@/components/commons/toggle";
import { Label } from "@/components/commons/label";
import { Section } from "@/components/commons/section";
import { Statistics } from "@/dtos/presetDto";

interface EditPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    points: number,
    time: number,
    pointScale: number,
    statistics: Statistics,
  ) => void;
  presetId: number | null;
  name: string;
  points: number;
  time: number;
  pointScale: number;
  statistics: Statistics;
  isPending?: boolean;
  error?: any;
}

export function EditPresetModal({
  isOpen,
  onClose,
  onSubmit,
  name: propName,
  points: propPoints,
  time: propTime,
  pointScale: propPointScale,
  statistics: propStatistics,
  isPending = false,
  error,
}: EditPresetModalProps) {
  const [name, setName] = useState(propName);
  const [inputPoints, setInputPoints] = useState(propPoints * propPointScale);
  const [time, setTime] = useState(propTime);
  const [pointScale, setPointScale] = useState(propPointScale);
  const [statistics, setStatistics] = useState<Statistics>(propStatistics);

  useEffect(() => {
    if (isOpen) {
      setName(propName);
      setInputPoints(propPoints * propPointScale);
      setTime(propTime);
      setPointScale(propPointScale);
      setStatistics(propStatistics);
    }
  }, [isOpen, propName, propPoints, propTime, propPointScale, propStatistics]);

  const isDivisible = inputPoints % pointScale === 0;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (!name.trim() || pointScale <= 0 || !isDivisible) return;
    const actualPoints = inputPoints / pointScale;
    onSubmit(name.trim(), actualPoints, time, pointScale, statistics);
  };

  const hasChanges =
    name !== propName ||
    inputPoints !== propPoints * propPointScale ||
    time !== propTime ||
    pointScale !== propPointScale ||
    statistics !== propStatistics;

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
          value={time.toString()}
          onChange={(value) => setTime(Number(value) || 0)}
        />
        <Section variantTone="ghost" variantIntent="tertiary">
          <Label>통계</Label>
          <Section variantLayout="row" variantIntent="tertiary">
            <Toggle
              type="button"
              isActive={statistics === Statistics.NONE}
              onClick={() => setStatistics(Statistics.NONE)}
            >
              없음
            </Toggle>
            <Toggle
              type="button"
              isActive={statistics === Statistics.LOL}
              onClick={() => setStatistics(Statistics.LOL)}
            >
              LoL
            </Toggle>
            <Toggle
              type="button"
              isActive={statistics === Statistics.VAL}
              onClick={() => setStatistics(Statistics.VAL)}
            >
              VALORANT
            </Toggle>
          </Section>
        </Section>

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
