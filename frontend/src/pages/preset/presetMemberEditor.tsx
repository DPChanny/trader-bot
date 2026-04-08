import { useEffect, useState } from "preact/hooks";
import { PresetMemberCard } from "@/components/presetMemberCard";
import { LolStat } from "@/components/lolStat";
import { ValStat } from "@/components/valStat";
import { Toggle } from "@/components/commons/toggle";
import {
  useRemovePresetMember,
  useUpdatePresetMember,
} from "@/hooks/presetMember";
import {
  useAddPresetMemberPosition,
  useDeletePresetMemberPosition,
} from "@/hooks/presetMemberPosition";
import { useLolStat } from "@/hooks/lolStat";
import { useValStat } from "@/hooks/valStat";
import type { PresetMemberDetailDTO } from "@/dtos/presetMemberDto";
import type { TierDTO } from "@/dtos/tierDto";
import type { PositionDTO } from "@/dtos/positionDto";
import { Statistics } from "@/dtos/presetDto";
import {
  CloseButton,
  DangerButton,
  SaveButton,
} from "@/components/commons/button";
import { Label } from "@/components/commons/label";
import { Error } from "@/components/commons/error";
import { Bar } from "@/components/commons/bar";
import { Section } from "@/components/commons/section";
import { Loading } from "@/components/commons/loading";
import styles from "@/styles/components/memberEditor.module.css";
import { useGuildContext } from "@/contexts/guildContext";
import { usePresetPageContext } from "./presetContext";

interface PresetMemberEditorProps {
  presetMember: PresetMemberDetailDTO;
  tiers: TierDTO[];
  positions: PositionDTO[];
  statistics: Statistics;
}

export function PresetMemberEditor({
  presetMember,
  tiers,
  positions,
  statistics,
}: PresetMemberEditorProps) {
  const { guild } = useGuildContext();
  const guildId = guild?.guildId ?? null;
  const {
    selectedPresetId: presetId,
    setSelectedPresetMemberId,
    addMemberIdToRemoving,
    removeMemberIdFromRemoving,
  } = usePresetPageContext();

  const updatePresetMember = useUpdatePresetMember();
  const removePresetMember = useRemovePresetMember();
  const addPresetMemberPosition = useAddPresetMemberPosition();
  const deletePresetMemberPosition = useDeletePresetMemberPosition();
  const lolStat = useLolStat(
    statistics === Statistics.LOL
      ? (presetMember.member?.memberId ?? null)
      : null,
  );
  const valStat = useValStat(
    statistics === Statistics.VAL
      ? (presetMember.member?.memberId ?? null)
      : null,
  );

  const [isLeader, setIsLeader] = useState(presetMember.isLeader);
  const [tierId, setTierId] = useState<number | null>(
    presetMember.tierId || null,
  );
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>(
    presetMember.presetMemberPositions?.map((p) => p.positionId) || [],
  );

  useEffect(() => {
    setIsLeader(presetMember.isLeader);
    setTierId(presetMember.tierId || null);
    setSelectedPositionIds(
      presetMember.presetMemberPositions?.map((p) => p.positionId) || [],
    );
  }, [
    presetMember.presetMemberId,
    presetMember.isLeader,
    presetMember.tierId,
    presetMember.presetMemberPositions,
  ]);

  const initialPositionIds =
    presetMember.presetMemberPositions?.map((p) => p.positionId) || [];
  const hasChanges =
    isLeader !== presetMember.isLeader ||
    tierId !== presetMember.tierId ||
    selectedPositionIds.length !== initialPositionIds.length ||
    selectedPositionIds.some((id) => !initialPositionIds.includes(id));

  const handleSave = async () => {
    if (!guildId || !presetId) return;
    try {
      if (
        isLeader !== presetMember.isLeader ||
        tierId !== presetMember.tierId
      ) {
        await updatePresetMember.mutateAsync({
          guildId,
          presetId,
          presetMemberId: presetMember.presetMemberId,
          dto: { tierId, isLeader },
        });
      }

      const positionIdsToAdd = selectedPositionIds.filter(
        (id) => !initialPositionIds.includes(id),
      );
      const positionIdsToRemove = initialPositionIds.filter(
        (id) => !selectedPositionIds.includes(id),
      );

      for (const positionId of positionIdsToRemove) {
        const entry = presetMember.presetMemberPositions?.find(
          (p) => p.positionId === positionId,
        );
        if (entry) {
          await deletePresetMemberPosition.mutateAsync({
            guildId,
            presetId,
            presetMemberId: presetMember.presetMemberId,
            presetMemberPositionId: entry.presetMemberPositionId,
          });
        }
      }

      for (const positionId of positionIdsToAdd) {
        await addPresetMemberPosition.mutateAsync({
          guildId,
          presetId,
          presetMemberId: presetMember.presetMemberId,
          dto: { positionId },
        });
      }
    } catch (err) {
      console.error("Failed to save preset member:", err);
    }
  };

  const handleTogglePosition = (positionId: number) => {
    if (selectedPositionIds.includes(positionId)) {
      setSelectedPositionIds(
        selectedPositionIds.filter((id) => id !== positionId),
      );
    } else {
      setSelectedPositionIds([...selectedPositionIds, positionId]);
    }
  };

  const handleToggleTier = (id: number) => {
    setTierId((prev) => (prev === id ? null : id));
  };

  const handleRemoveMember = async () => {
    try {
      if (presetMember.memberId) addMemberIdToRemoving(presetMember.memberId);
      await removePresetMember.mutateAsync({
        guildId: guildId!,
        presetId: presetId!,
        presetMemberId: presetMember.presetMemberId,
      });
      setSelectedPresetMemberId(null);
    } catch (err) {
      console.error("Failed to remove preset member:", err);
      if (presetMember.memberId)
        removeMemberIdFromRemoving(presetMember.memberId);
    }
  };

  const hasError =
    updatePresetMember.isError ||
    addPresetMemberPosition.isError ||
    deletePresetMemberPosition.isError ||
    removePresetMember.isError;

  const previewPositions = selectedPositionIds.map((id) => {
    const existingEntry = presetMember.presetMemberPositions?.find(
      (p) => p.positionId === id,
    );
    return {
      presetMemberPositionId: existingEntry?.presetMemberPositionId || 0,
      presetMemberId: presetMember.presetMemberId,
      positionId: id,
    };
  });

  const previewPresetMember = {
    ...presetMember,
    tierId: tierId,
    isLeader: isLeader,
    presetMemberPositions: previewPositions,
  };

  return (
    <Section variantIntent="primary" className={styles.panelSection}>
      <Section variantTone="ghost" variantIntent="secondary">
        <Section
          variantTone="ghost"
          variantLayout="row"
          variantIntent="secondary"
        >
          <h3>
            {presetMember.member?.discord?.name ||
              presetMember.member?.riotId ||
              "이름 없음"}
          </h3>
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantIntent="secondary"
          >
            <SaveButton
              onClick={handleSave}
              disabled={updatePresetMember.isPending || !hasChanges}
            />
            <CloseButton onClick={() => setSelectedPresetMemberId(null)} />
          </Section>
        </Section>
        {hasError && (
          <Error
            detail={
              (
                updatePresetMember.error ||
                addPresetMemberPosition.error ||
                deletePresetMemberPosition.error ||
                removePresetMember.error
              )?.message
            }
          >
            프리셋 멤버 정보 저장에 실패했습니다.
          </Error>
        )}
      </Section>

      <Bar />

      <Section
        className={styles.content}
        variantTone="ghost"
        variantIntent="secondary"
      >
        <Section variantTone="ghost">
          <Section variantTone="ghost" className={styles.cardSection}>
            <PresetMemberCard
              presetMember={previewPresetMember}
              tiers={tiers}
              positions={positions}
            />
          </Section>

          <Label>팀장</Label>
          <Section variantIntent="secondary">
            <Toggle
              isActive={isLeader}
              variantColor="gold"
              onClick={() => setIsLeader(!isLeader)}
            >
              팀장
            </Toggle>
          </Section>

          <Label>티어</Label>
          <Section
            variantLayout="row"
            variantIntent="secondary"
            className={styles.toggleSection}
          >
            {tiers?.map((tier) => (
              <Toggle
                key={tier.tierId}
                isActive={tierId === tier.tierId}
                variantColor="red"
                onClick={() => handleToggleTier(tier.tierId)}
              >
                {tier.name}
              </Toggle>
            ))}
          </Section>

          <Label>포지션</Label>
          <Section
            variantLayout="row"
            variantIntent="secondary"
            className={styles.toggleSection}
          >
            {positions.map((position) => (
              <Toggle
                key={position.positionId}
                isActive={selectedPositionIds.includes(position.positionId)}
                variantColor="blue"
                onClick={() => handleTogglePosition(position.positionId)}
              >
                {position.name}
              </Toggle>
            ))}
          </Section>

          {statistics !== Statistics.NONE && <Label>통계</Label>}

          {statistics === Statistics.LOL && (
            <>
              {lolStat.isLoading ? (
                <Loading />
              ) : lolStat.data ? (
                <LolStat lolStatDTO={lolStat.data} />
              ) : (
                <Error detail={lolStat.error?.message}>
                  통계를 불러오지 못했습니다.
                </Error>
              )}
            </>
          )}

          {statistics === Statistics.VAL && (
            <>
              {valStat.isLoading ? (
                <Loading />
              ) : valStat.data ? (
                <ValStat valStatDTO={valStat.data} />
              ) : (
                <Error detail={valStat.error?.message}>
                  통계를 불러오지 못했습니다.
                </Error>
              )}
            </>
          )}
        </Section>
      </Section>

      <Bar />
      <Section variantTone="ghost" variantIntent="secondary">
        <DangerButton
          variantSize="large"
          onClick={handleRemoveMember}
          disabled={removePresetMember.isPending}
        >
          멤버 제거
        </DangerButton>
      </Section>
    </Section>
  );
}
