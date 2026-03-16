import { useEffect, useState } from "preact/hooks";
import { PresetUserCard } from "@/components/presetUserCard";
import { LolStatCard } from "@/components/lolStatCard";
import { ValStatCard } from "@/components/valStatCard";
import { Toggle } from "@/components/toggle";
import { useRemovePresetUser, useUpdatePresetUser } from "@/hooks/presetUser";
import {
  useAddPresetUserPosition,
  useDeletePresetUserPosition,
} from "@/hooks/presetUserPosition";
import { useLolStat } from "@/hooks/lolStat";
import { useValStat } from "@/hooks/valStat";
import {
  type Position,
  type PresetUserDetail,
  type Statistics,
  type Tier,
} from "@/dto";
import { CloseButton, DangerButton, SaveButton } from "@/components/button";
import { Label } from "@/components/label";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { Section } from "@/components/section";
import { Loading } from "@/components/loading";
import styles from "@/styles/pages/preset/presetUserEditor.module.css";

interface PresetUserEditorProps {
  presetUser: PresetUserDetail;
  presetId: number;
  statistics: Statistics;
  tiers: Tier[];
  positions: Position[];
  onClose: () => void;
  onRemoveStart?: (userId: number) => void;
  onRemoveError?: (userId: number) => void;
}

export function PresetUserEditor({
  presetUser,
  presetId,
  statistics,
  tiers,
  positions,
  onClose,
  onRemoveStart,
  onRemoveError,
}: PresetUserEditorProps) {
  const updatePresetUser = useUpdatePresetUser();
  const removePresetUser = useRemovePresetUser();
  const addPresetUserPosition = useAddPresetUserPosition();
  const deletePresetUserPosition = useDeletePresetUserPosition();
  const lolStat = useLolStat(
    statistics === "LOL" ? presetUser.user.userId : null,
  );
  const valStat = useValStat(
    statistics === "VAL" ? presetUser.user.userId : null,
  );

  const [isLeader, setIsLeader] = useState(presetUser.isLeader);
  const [tierId, setTierId] = useState<number | null>(
    presetUser.tierId || null,
  );
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>(
    presetUser.positions?.map((p) => p.position.positionId) || [],
  );

  useEffect(() => {
    setIsLeader(presetUser.isLeader);
    setTierId(presetUser.tierId || null);
    setSelectedPositionIds(
      presetUser.positions?.map((p) => p.position.positionId) || [],
    );
  }, [
    presetUser.presetUserId,
    presetUser.isLeader,
    presetUser.tierId,
    presetUser.positions,
  ]);

  const initialPositionIds =
    presetUser.positions?.map((p) => p.position.positionId) || [];
  const hasChanges =
    isLeader !== presetUser.isLeader ||
    tierId !== presetUser.tierId ||
    selectedPositionIds.length !== initialPositionIds.length ||
    selectedPositionIds.some((id) => !initialPositionIds.includes(id));

  const handleSave = async () => {
    try {
      if (isLeader !== presetUser.isLeader || tierId !== presetUser.tierId) {
        await updatePresetUser.mutateAsync({
          presetUserId: presetUser.presetUserId,
          presetId,
          data: { tierId, isLeader },
        });
      }

      const positionIdsToAdd = selectedPositionIds.filter(
        (id) => !initialPositionIds.includes(id),
      );
      const positionIdsToRemove = initialPositionIds.filter(
        (id) => !selectedPositionIds.includes(id),
      );

      for (const positionId of positionIdsToRemove) {
        const position = presetUser.positions?.find(
          (p) => p.position.positionId === positionId,
        );
        if (position) {
          await deletePresetUserPosition.mutateAsync({
            presetUserPositionId: position.presetUserPositionId,
            presetId,
          } as any);
        }
      }

      for (const positionId of positionIdsToAdd) {
        await addPresetUserPosition.mutateAsync({
          presetUserId: presetUser.presetUserId,
          positionId,
          presetId,
        } as any);
      }
    } catch (err) {
      console.error("Failed to save preset user:", err);
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

  const handleRemoveUser = async () => {
    try {
      onRemoveStart?.(presetUser.user.userId);
      await removePresetUser.mutateAsync({
        presetUserId: presetUser.presetUserId,
        presetId,
      });
      onClose();
    } catch (err) {
      console.error("Failed to remove preset user:", err);
      onRemoveError?.(presetUser.user.userId);
    }
  };

  const hasError =
    updatePresetUser.isError ||
    addPresetUserPosition.isError ||
    deletePresetUserPosition.isError ||
    removePresetUser.isError;

  const previewTier = tierId
    ? tiers?.find((t) => t.tierId === tierId) || null
    : null;
  const previewPositions = selectedPositionIds
    .map((id) => {
      const position = positions.find((p) => p.positionId === id);
      if (!position) return null;
      const existingPositionId =
        presetUser.positions?.find((p) => p.position.positionId === id)
          ?.presetUserPositionId || 0;
      return {
        presetUserPositionId: existingPositionId,
        presetUserId: presetUser.presetUserId,
        positionId: id,
        position: position,
      };
    })
    .filter((p) => p !== null) as any[];

  const previewPresetUser = {
    ...presetUser,
    tierId: tierId,
    tier: previewTier,
    isLeader: isLeader,
    positions: previewPositions,
  };

  return (
    <Section variantType="primary" className={styles.panel}>
      <Section variantTone="ghost">
        <Section variantTone="ghost" variantLayout="row">
          <h3>{presetUser.user.name}</h3>
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantType="secondary"
          >
            <SaveButton
              onClick={handleSave}
              disabled={updatePresetUser.isPending || !hasChanges}
            />
            <CloseButton onClick={onClose} />
          </Section>
        </Section>
        <Bar />

        {hasError && <Error>프리셋 유저 정보 저장에 실패했습니다.</Error>}
      </Section>

      <div className={styles.content}>
        <Section variantTone="ghost">
          <Section variantTone="ghost" className={styles.cardSection}>
            <PresetUserCard
              presetUser={previewPresetUser}
              variantVariant="compact"
            />
          </Section>

          <Label>팀장</Label>
          <Section variantType="secondary">
            <Toggle
              variantActive={isLeader}
              variantColor="gold"
              onClick={() => setIsLeader(!isLeader)}
            >
              팀장
            </Toggle>
          </Section>

          <Label>티어</Label>
          <Section
            variantLayout="row"
            variantType="secondary"
            className={styles.toggleSection}
          >
            {tiers?.map((tier) => (
              <Toggle
                key={tier.tierId}
                variantActive={tierId === tier.tierId}
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
            variantType="secondary"
            className={styles.toggleSection}
          >
            {positions.map((position) => (
              <Toggle
                key={position.positionId}
                variantActive={selectedPositionIds.includes(
                  position.positionId,
                )}
                variantColor="blue"
                onClick={() => handleTogglePosition(position.positionId)}
              >
                {position.name}
              </Toggle>
            ))}
          </Section>

          <Bar />

          {statistics === "LOL" && (
            <>
              {lolStat.isLoading ? (
                <Loading />
              ) : lolStat.data ? (
                <LolStatCard lolStatDto={lolStat.data} />
              ) : (
                <Error>LOL 통계를 불러오지 못했습니다.</Error>
              )}
            </>
          )}

          {statistics === "VAL" && (
            <>
              {valStat.isLoading ? (
                <Loading />
              ) : valStat.data ? (
                <ValStatCard valStatDto={valStat.data} />
              ) : (
                <Error>VAL 통계를 불러오지 못했습니다.</Error>
              )}
            </>
          )}
        </Section>
      </div>

      <Section variantTone="ghost" className={styles.footer}>
        <DangerButton
          variantSize="large"
          onClick={handleRemoveUser}
          disabled={removePresetUser.isPending}
        >
          유저 제거
        </DangerButton>
      </Section>
    </Section>
  );
}
