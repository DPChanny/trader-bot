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
import {
  UpdatePresetMemberSchema,
  type UpdatePresetMemberDTO,
} from "@dtos/presetMember";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import { CloseButton, SaveButton, Button } from "@components/atoms/button";
import { Label, NameTitle } from "@components/atoms/text";
import { Error } from "@components/molecules/error";
import { LabelToggle } from "@components/molecules/labelToggle";
import { LabelInput } from "@components/molecules/labelInput";
import { Bar } from "@components/atoms/bar";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Column, Row, Scroll } from "@components/atoms/layout";
import { buildPatchDTO } from "@utils/dto";

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
  const canDelete = useVerifyRole(guildId, Role.ADMIN);

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
  const [infoUrl, setInfoUrl] = useState(presetMember.infoUrl ?? "");
  const [selectedPositionIds, setSelectedPositionIds] = useState<number[]>(
    presetMember.presetMemberPositions?.map((p) => p.positionId) || [],
  );
  const [savedPositionEntries, setSavedPositionEntries] = useState(
    () =>
      presetMember.presetMemberPositions?.map((p) => ({
        positionId: p.positionId,
        presetMemberPositionId: p.presetMemberPositionId,
      })) || [],
  );
  const [savedSnapshot, setSavedSnapshot] = useState(() => ({
    isLeader: presetMember.isLeader,
    tierId: presetMember.tierId ?? null,
    infoUrl: presetMember.infoUrl,
    positionIds:
      presetMember.presetMemberPositions?.map((p) => p.positionId) || [],
  }));
  useEffect(() => {
    setIsLeader(presetMember.isLeader);
    setTierId(presetMember.tierId || null);
    setInfoUrl(presetMember.infoUrl ?? "");
    const positionIds =
      presetMember.presetMemberPositions?.map((p) => p.positionId) || [];
    const positionEntries =
      presetMember.presetMemberPositions?.map((p) => ({
        positionId: p.positionId,
        presetMemberPositionId: p.presetMemberPositionId,
      })) || [];
    setSelectedPositionIds(positionIds);
    setSavedPositionEntries(positionEntries);
    setSavedSnapshot({
      isLeader: presetMember.isLeader,
      tierId: presetMember.tierId ?? null,
      infoUrl: presetMember.infoUrl,
      positionIds,
    });
    setIsSaving(false);
  }, [
    presetMember.presetMemberId,
    presetMember.isLeader,
    presetMember.tierId,
    presetMember.infoUrl,
    presetMember.presetMemberPositions,
  ]);

  const parseResult = UpdatePresetMemberSchema.safeParse({ infoUrl });
  const isFormValid = parseResult.success;
  const normalizedInfoUrl = parseResult.success
    ? (parseResult.data.infoUrl ?? null)
    : null;
  const patchDTO = parseResult.success
    ? buildPatchDTO(
        {
          isLeader,
          tierId,
          infoUrl: normalizedInfoUrl,
        },
        {
          isLeader: savedSnapshot.isLeader,
          tierId: savedSnapshot.tierId,
          infoUrl: savedSnapshot.infoUrl,
        },
      )
    : null;

  const sortedSelectedPositionIds = [...selectedPositionIds].sort(
    (a, b) => a - b,
  );
  const sortedSavedPositionIds = [...savedSnapshot.positionIds].sort(
    (a, b) => a - b,
  );
  const hasChanges =
    patchDTO !== null ||
    sortedSelectedPositionIds.length !== sortedSavedPositionIds.length ||
    sortedSelectedPositionIds.some(
      (id, index) => id !== sortedSavedPositionIds[index],
    );

  const handleSave = async () => {
    if (!isFormValid || isSaving || !hasChanges) return;
    setIsSaving(true);
    try {
      if (patchDTO) {
        const dto: UpdatePresetMemberDTO = { ...patchDTO };
        const [result] = await Promise.allSettled([
          updatePresetMember.mutateAsync({
            guildId,
            presetId,
            presetMemberId: presetMember.presetMemberId,
            dto,
          }),
        ]);
        if (result.status === "rejected") return;
      }

      let nextSavedPositionEntries = [...savedPositionEntries];
      const savedPositionEntryMap = new Map(
        nextSavedPositionEntries.map((entry) => [
          entry.positionId,
          entry.presetMemberPositionId,
        ]),
      );
      const savedPositionIds = nextSavedPositionEntries.map(
        (entry) => entry.positionId,
      );
      const positionIdsToAdd = selectedPositionIds.filter(
        (id) => !savedPositionIds.includes(id),
      );
      const positionIdsToRemove = savedPositionIds.filter(
        (id) => !selectedPositionIds.includes(id),
      );

      for (const positionId of positionIdsToRemove) {
        const existingId = savedPositionEntryMap.get(positionId);
        const fallbackEntry = presetMember.presetMemberPositions?.find(
          (p) => p.positionId === positionId,
        );
        const presetMemberPositionId =
          existingId ?? fallbackEntry?.presetMemberPositionId;
        if (!presetMemberPositionId) return;
        const [result] = await Promise.allSettled([
          deletePresetMemberPosition.mutateAsync({
            guildId,
            presetId,
            presetMemberId: presetMember.presetMemberId,
            presetMemberPositionId,
          }),
        ]);
        if (result.status === "rejected") return;
        nextSavedPositionEntries = nextSavedPositionEntries.filter(
          (entry) => entry.positionId !== positionId,
        );
        savedPositionEntryMap.delete(positionId);
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
        nextSavedPositionEntries = [
          ...nextSavedPositionEntries.filter(
            (entry) => entry.positionId !== positionId,
          ),
          {
            positionId: result.value.positionId,
            presetMemberPositionId: result.value.presetMemberPositionId,
          },
        ];
        savedPositionEntryMap.set(
          result.value.positionId,
          result.value.presetMemberPositionId,
        );
      }

      setSavedPositionEntries(nextSavedPositionEntries);
      setSavedSnapshot({
        isLeader,
        tierId,
        infoUrl: normalizedInfoUrl,
        positionIds: nextSavedPositionEntries.map((entry) => entry.positionId),
      });
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
      const existingEntry = savedPositionEntries.find(
        (entry) => entry.positionId === id,
      );
      const fallbackEntry = presetMember.presetMemberPositions?.find(
        (p) => p.positionId === id,
      );
      const position = positionsMap.get(id);
      if (!position) return null;
      return {
        presetMemberPositionId:
          existingEntry?.presetMemberPositionId ||
          fallbackEntry?.presetMemberPositionId ||
          0,
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
    infoUrl: parseResult.success ? normalizedInfoUrl : savedSnapshot.infoUrl,
    presetMemberPositions: previewPositions,
  };

  const error =
    updatePresetMember.error ||
    createPresetMemberPosition.error ||
    deletePresetMemberPosition.error ||
    removePresetMember.error;
  return (
    <PrimarySection minSize style={{ width: "25rem" }}>
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
                disabled={isSaving || !hasChanges || !isFormValid}
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
              disabled={!canEdit || isSaving}
              onClick={() => setIsLeader(!isLeader)}
            >
              팀장
            </LabelToggle>
            <LabelInput
              label="정보 링크"
              value={infoUrl}
              onValueChange={setInfoUrl}
              placeholder={presetMember.member.infoUrl ?? undefined}
              disabled={!canEdit || isSaving}
            />
            <Column gap="xs">
              <Label>티어</Label>
              <TertiarySection>
                <Row wrap>
                  <Toggle
                    isPressed={tierId === null}
                    variantColor="red"
                    disabled={!canEdit || isSaving}
                    onClick={() => setTierId(null)}
                  >
                    없음
                  </Toggle>
                  {tiers?.map((tier) => (
                    <Toggle
                      key={tier.tierId}
                      isPressed={tierId === tier.tierId}
                      variantColor="red"
                      disabled={!canEdit || isSaving}
                      onClick={() => handleToggleTier(tier.tierId)}
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
                    disabled={!canEdit || isSaving}
                    onClick={() => setSelectedPositionIds([])}
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
                      disabled={!canEdit || isSaving}
                      onClick={() => handleTogglePosition(position.positionId)}
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

      {canDelete && (
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
