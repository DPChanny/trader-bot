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
import { Toggle } from "@/components/commons/toggle";
import { Label } from "@/components/commons/label";
import { Section } from "@/components/commons/section";
import { useAddPreset } from "@/hooks/preset";
import { useGuildContext } from "@/contexts/guildContext";
import { usePresetPageContext } from "./presetContext";
import { Statistics, StatisticsDisplay } from "@/dtos/presetDto";

const INITIAL_STATE = {
  presetName: "",
  inputPoints: 1000,
  pointScale: 1,
  timer: 30,
  teamSize: 5,
  statistics: Statistics.NONE as Statistics,
};

export function AddPresetModal() {
  const { guild } = useGuildContext();
  const guildId = guild?.discordId ?? null;
  const { isCreatingPreset, closeCreatePreset } = usePresetPageContext();

  const [presetName, setPresetName] = useState(INITIAL_STATE.presetName);
  const [inputPoints, setInputPoints] = useState(INITIAL_STATE.inputPoints);
  const [pointScale, setPointScale] = useState(INITIAL_STATE.pointScale);
  const [timer, setTimer] = useState(INITIAL_STATE.timer);
  const [teamSize, setTeamSize] = useState(INITIAL_STATE.teamSize);
  const [statistics, setStatistics] = useState<Statistics>(
    INITIAL_STATE.statistics,
  );

  const addPreset = useAddPreset();
  const isDivisible = inputPoints % pointScale === 0;

  const handleClose = () => {
    setPresetName(INITIAL_STATE.presetName);
    setInputPoints(INITIAL_STATE.inputPoints);
    setPointScale(INITIAL_STATE.pointScale);
    setTimer(INITIAL_STATE.timer);
    setTeamSize(INITIAL_STATE.teamSize);
    setStatistics(INITIAL_STATE.statistics);
    addPreset.reset();
    closeCreatePreset();
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!presetName.trim() || pointScale <= 0 || !isDivisible || !guildId)
      return;
    const actualPoints = inputPoints / pointScale;
    try {
      await addPreset.mutateAsync({
        guildId,
        dto: {
          name: presetName.trim(),
          points: actualPoints,
          timer,
          teamSize,
          pointScale,
          statistics,
        },
      });
      handleClose();
    } catch {}
  };

  return (
    <Modal isOpen={isCreatingPreset} onClose={handleClose} title="프리셋 추가">
      <ModalForm onSubmit={handleSubmit}>
        {addPreset.isError ? (
          <ErrorMessage detail={addPreset.error.message}>
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
            value={inputPoints.toString()}
            onChange={(v) => setInputPoints(parseInt(v) || 1000)}
          />
          <LabelInput
            label="포인트 스케일"
            type="number"
            value={pointScale.toString()}
            onChange={(v) => setPointScale(parseInt(v) || 1)}
          />
        </ModalRow>
        {!isDivisible ? (
          <ErrorMessage>
            포인트는 포인트 스케일로 나뉘어떨어져야 합니다.
          </ErrorMessage>
        ) : null}
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
              {StatisticsDisplay[Statistics.LOL]}
            </Toggle>
            <Toggle
              type="button"
              isActive={statistics === Statistics.VAL}
              onClick={() => setStatistics(Statistics.VAL)}
            >
              {StatisticsDisplay[Statistics.VAL]}
            </Toggle>
          </Section>
        </Section>
        <ModalFooter>
          <SecondaryButton onClick={handleClose}>취소</SecondaryButton>
          <PrimaryButton
            type="submit"
            disabled={
              addPreset.isPending ||
              !presetName.trim() ||
              !isDivisible ||
              pointScale <= 0
            }
          >
            추가
          </PrimaryButton>
        </ModalFooter>
      </ModalForm>
    </Modal>
  );
}
