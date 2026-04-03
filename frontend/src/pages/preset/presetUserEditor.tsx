import { useEffect, useState } from "preact/hooks";
import { PresetUserCard } from "@/components/presetUserCard";
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
import type { PositionDTO } from "@/dtos/positionDto";
import type { PresetMemberDetailDTO } from "@/dtos/presetMemberDto";
import type { Statistics } from "@/dtos/presetDto";
import type { TierDTO } from "@/dtos/tierDto";
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
import styles from "@/styles/components/userEditor.module.css";

interface PresetUserEditorProps {
  presetMember: PresetMemberDetailDTO;
  guildId: number;
  presetId: number;
  statistics: Statistics;
  tiers: TierDTO[];
  positions: PositionDTO[];
  onClose: () => void;
  onRemoveStart?: (memberId: number) => void;
  onRemoveError?: (memberId: number) => void;
}

export function PresetUserEditor({
  presetMember,
  guildId,
  presetId,
  statistics,
  tiers,
  positions,
  onClose,
  onRemoveStart,
  onRemoveError,
}: PresetUserEditorProps) {
  const updatePresetMember = useUpdatePresetMember();
  const removePresetMember = useRemovePresetMember();
  const addPresetMemberPosition = useAddPresetMemberPosition();
  const deletePresetMemberPosition = useDeletePresetMemberPosition();
  const lolStat = useLolStat(
    statistics === "LOL" ? (presetMember.member?.memberId ?? null) : null,
  );
  const valStat = useValStat(
    statistics === "VAL" ? (presetMember.member?.memberId ?? null) : null,
  );

  const [isLeader, setIsLeader] = useState(presetMember.isLeader);
  const [tierId, setTierId] = useState<number | null>(
    presetMember.tierId || null,
  );
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>(
    presetMember.presetMemberPositions?.map((p) => p.position.positionId) || [],
  );

  useEffect(() => {
    setIsLeader(presetMember.isLeader);
    setTierId(presetMember.tierId || null);
    setSelectedPositionIds(
      presetMember.presetMemberPositions?.map((p) => p.position.positionId) ||
        [],
    );
  }, [
    presetMember.presetMemberId,
    presetMember.isLeader,
    presetMember.tierId,
    presetMember.presetMemberPositions,
  ]);

  const initialPositionIds =
    presetMember.presetMemberPositions?.map((p) => p.position.positionId) || [];
  const hasChanges =
    isLeader !== presetMember.isLeader ||
    tierId !== presetMember.tierId ||
    selectedPositionIds.length !== initialPositionIds.length ||
    selectedPositionIds.some((id) => !initialPositionIds.includes(id));

  const handleSave = async () => {
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
          (p) => p.position.positionId === positionId,
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
      onRemoveStart?.(presetMember.memberId);
      await removePresetMember.mutateAsync({
        guildId,
        presetId,
        presetMemberId: presetMember.presetMemberId,
      });
      onClose();
    } catch (err) {
      console.error("Failed to remove preset member:", err);
      onRemoveError?.(presetMember.memberId);
    }
  };

  const hasError =
    updatePresetMember.isError ||
    addPresetMemberPosition.isError ||
    deletePresetMemberPosition.isError ||
    removePresetMember.isError;

  const previewTier = tierId
    ? tiers?.find((t) => t.tierId === tierId) || null
    : null;
  const previewPositions = selectedPositionIds
    .map((id) => {
      const position = positions.find((p) => p.positionId === id);
      if (!position) return null;
      const existingEntry = presetMember.presetMemberPositions?.find(
        (p) => p.position.positionId === id,
      );
      return {
        presetMemberPositionId: existingEntry?.presetMemberPositionId || 0,
        presetMemberId: presetMember.presetMemberId,
        positionId: id,
        position: position,
      };
    })
    .filter((p) => p !== null) as any[];

  const previewPresetMember = {
    ...presetMember,
    tierId: tierId,
    tier: previewTier,
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
          <h3>{presetMember.member?.alias || "이름 없음"}</h3>
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantIntent="secondary"
          >
            <SaveButton
              onClick={handleSave}
              disabled={updatePresetMember.isPending || !hasChanges}
            />
            <CloseButton onClick={onClose} />
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
            <PresetUserCard presetMember={previewPresetMember} />
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

          {statistics !== "NONE" && <Label>통계</Label>}

          {statistics === "LOL" && (
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

          {statistics === "VAL" && (
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
