import { useEffect, useMemo, useState } from "preact/hooks";
import { PresetMemberCard } from "@components/presetMemberCard";
import { Toggle } from "@components/molecules/toggle";
import {
  useDeletePresetMember,
  useUpdatePresetMember,
} from "@hooks/presetMember";
import {
  useCreatePresetMemberPosition,
  useDeletePresetMemberPosition,
} from "@hooks/presetMemberPosition";
import { useTiers } from "@hooks/tier";
import { usePositions } from "@hooks/position";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import { CloseButton, SaveButton, Button } from "@components/atoms/button";
import { Label, NameTitle } from "@components/atoms/text";
import { Error } from "@components/molecules/error";
import { LabelToggle } from "@components/molecules/labelToggle";
import { Bar } from "@components/atoms/bar";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { Column, Row, Scroll } from "@components/atoms/layout";
import { buildPatchDto } from "@utils/dto";

interface PresetMemberPanelProps {
  presetMember: PresetMemberDetailDTO;
  onClose: () => void;
  onRemoveStart: (memberId: number) => void;
  onRemoveRollback: (memberId: number) => void;
}

export function PresetMemberPanel({
  presetMember,
  onClose,
  onRemoveStart,
  onRemoveRollback,
}: PresetMemberPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const updatePresetMember = useUpdatePresetMember();
  const removePresetMember = useDeletePresetMember();
  const createPresetMemberPosition = useCreatePresetMemberPosition();
  const deletePresetMemberPosition = useDeletePresetMemberPosition();
  const guildId = presetMember.member.guildId;
  const presetId = presetMember.presetId;
  const { data: tiers = [] } = useTiers(guildId, presetId);
  const { data: positions = [] } = usePositions(guildId, presetId);
  const canEdit = useVerifyRole(guildId, Role.EDITOR);

  const tiersMap = useMemo(
    () => new Map(tiers.map((t) => [t.tierId, t])),
    [tiers],
  );
  const positionsMap = useMemo(
    () => new Map(positions.map((p) => [p.positionId, p])),
    [positions],
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
    setIsSaving(true);
    try {
      const patchDto = buildPatchDto(
        { isLeader, tierId },
        {
          isLeader: presetMember.isLeader,
          tierId: presetMember.tierId ?? null,
        },
      );
      if (patchDto) {
        const [result] = await Promise.allSettled([
          updatePresetMember.mutateAsync({
            guildId,
            presetId,
            presetMemberId: presetMember.presetMemberId,
            dto: patchDto,
          }),
        ]);
        if (result.status === "rejected") return;
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
          const [result] = await Promise.allSettled([
            deletePresetMemberPosition.mutateAsync({
              guildId,
              presetId,
              presetMemberId: presetMember.presetMemberId,
              presetMemberPositionId: entry.presetMemberPositionId,
            }),
          ]);
          if (result.status === "rejected") return;
        }
      }

      for (const positionId of positionIdsToAdd) {
        const [result] = await Promise.allSettled([
          createPresetMemberPosition.mutateAsync({
            guildId,
            presetId,
            presetMemberId: presetMember.presetMemberId,
            dto: { positionId },
          }),
        ]);
        if (result.status === "rejected") return;
      }
    } finally {
      setIsSaving(false);
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

  const handleRemoveMember = () => {
    if (presetMember.memberId) onRemoveStart(presetMember.memberId);
    removePresetMember.mutate(
      {
        guildId,
        presetId,
        presetMemberId: presetMember.presetMemberId,
      },
      {
        onSuccess: () => {
          onClose();
        },
        onError: () => {
          if (presetMember.memberId) {
            onRemoveRollback(presetMember.memberId);
          }
        },
      },
    );
  };

  const previewPositions = selectedPositionIds
    .map((id) => {
      const existingEntry = presetMember.presetMemberPositions?.find(
        (p) => p.positionId === id,
      );
      const position = positionsMap.get(id);
      if (!position) return null;
      return {
        presetMemberPositionId: existingEntry?.presetMemberPositionId || 0,
        presetMemberId: presetMember.presetMemberId,
        positionId: id,
        position,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const previewTier = tierId ? (tiersMap.get(tierId) ?? null) : null;

  const previewPresetMember = {
    ...presetMember,
    tierId: tierId,
    tier: previewTier,
    isLeader: isLeader,
    presetMemberPositions: previewPositions,
  };

  const error =
    updatePresetMember.error ||
    createPresetMemberPosition.error ||
    deletePresetMemberPosition.error ||
    removePresetMember.error;
  return (
    <PrimarySection minSize style={{ width: "24rem" }}>
      <Column>
        <Row justify="between">
          <NameTitle>
            {presetMember.member.alias ||
              presetMember.member.name ||
              presetMember.member.user.name}
          </NameTitle>
          <Row gap="sm" align="center">
            {canEdit && (
              <SaveButton
                onClick={handleSave}
                disabled={isSaving || !hasChanges}
              />
            )}
            <CloseButton onClick={onClose} />
          </Row>
        </Row>
      </Column>

      {error && <Error error={error}>프리셋 멤버 수정에 실패했습니다</Error>}

      <Bar />

      <Scroll axis="y">
        <Column align="center" fill>
          <PresetMemberCard presetMember={previewPresetMember} />
          <SecondarySection fill>
            <LabelToggle
              label="팀장"
              isPressed={isLeader}
              variantColor="gold"
              disabled={!canEdit}
              onClick={() => canEdit && setIsLeader(!isLeader)}
            >
              팀장
            </LabelToggle>

            <Column gap="xs">
              <Label>티어</Label>
              <TertiarySection>
                <Row wrap>
                  <Toggle
                    isPressed={tierId === null}
                    variantColor="red"
                    disabled={!canEdit}
                    onClick={() => canEdit && setTierId(null)}
                  >
                    없음
                  </Toggle>
                  {tiers?.map((tier) => (
                    <Toggle
                      key={tier.tierId}
                      isPressed={tierId === tier.tierId}
                      variantColor="red"
                      disabled={!canEdit}
                      onClick={() => canEdit && handleToggleTier(tier.tierId)}
                    >
                      {tier.name}
                    </Toggle>
                  ))}
                </Row>
              </TertiarySection>
            </Column>

            <Column gap="xs">
              <Label>포지션</Label>
              <TertiarySection>
                <Row wrap>
                  <Toggle
                    isPressed={selectedPositionIds.length === 0}
                    variantColor="blue"
                    disabled={!canEdit}
                    onClick={() => canEdit && setSelectedPositionIds([])}
                  >
                    없음
                  </Toggle>
                  {positions.map((position) => (
                    <Toggle
                      key={position.positionId}
                      isPressed={selectedPositionIds.includes(
                        position.positionId,
                      )}
                      variantColor="blue"
                      disabled={!canEdit}
                      onClick={() =>
                        canEdit && handleTogglePosition(position.positionId)
                      }
                    >
                      {position.name}
                    </Toggle>
                  ))}
                </Row>
              </TertiarySection>
            </Column>
          </SecondarySection>
        </Column>
      </Scroll>

      {canEdit && (
        <Button
          variantIntent="warning"
          onClick={handleRemoveMember}
          disabled={removePresetMember.isPending}
        >
          제거
        </Button>
      )}
    </PrimarySection>
  );
}
