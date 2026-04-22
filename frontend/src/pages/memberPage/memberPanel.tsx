import { useEffect, useState } from "preact/hooks";
import { MemberCard } from "@components/memberCard";
import { useUpdateMember } from "@features/member/hook";
import { CloseButton, SaveButton } from "@components/atoms/button";
import { LabelInput } from "@components/molecules/labelInput";
import { Error } from "@components/molecules/error";
import { Bar } from "@components/atoms/bar";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Column, Row, Scroll } from "@components/atoms/layout";
import { Toggle } from "@components/molecules/toggle";
import { Label, NameTitle } from "@components/atoms/text";
import {
  UpdateMemberSchema,
  type MemberDetailDTO,
  type UpdateMemberDTO,
} from "@features/member/dto";
import { Role } from "@features/member/dto";
import { useVerifyRole } from "@features/member/hook";
import { buildPatchDTO } from "@utils/dto";
import { getRoleEntries } from "@features/member/enum";

interface MemberPanelProps {
  member: MemberDetailDTO;
  onClose: () => void;
}

export function MemberPanel({ member, onClose }: MemberPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const updateMember = useUpdateMember();
  const roleEntries = Object.values(getRoleEntries());

  const [alias, setAlias] = useState(member.alias ?? "");
  const [infoUrl, setInfoUrl] = useState(member.infoUrl ?? "");
  const [role, setRole] = useState(member.role);
  const [savedSnapshot, setSavedSnapshot] = useState({
    alias: member.alias,
    infoUrl: member.infoUrl,
    role: member.role,
  });

  useEffect(() => {
    setAlias(member.alias ?? "");
    setInfoUrl(member.infoUrl ?? "");
    setRole(member.role);
    setSavedSnapshot({
      alias: member.alias,
      infoUrl: member.infoUrl,
      role: member.role,
    });
    setIsSaving(false);
  }, [member.memberId, member.alias, member.infoUrl, member.role]);

  const canEdit = useVerifyRole(member.guildId, Role.EDITOR);
  const canEditRole = useVerifyRole(member.guildId, Role.ADMIN);
  const isOwnerMember = member.role === Role.OWNER;

  const parseResult = UpdateMemberSchema.safeParse({ alias, infoUrl });
  const isFormValid = parseResult.success;
  const normalizedAlias = parseResult.success
    ? (parseResult.data.alias ?? null)
    : null;
  const normalizedInfoUrl = parseResult.success
    ? (parseResult.data.infoUrl ?? null)
    : null;
  const patchDTO = parseResult.success
    ? buildPatchDTO(
        {
          alias: normalizedAlias,
          infoUrl: normalizedInfoUrl,
        },
        { alias: savedSnapshot.alias, infoUrl: savedSnapshot.infoUrl },
      )
    : null;
  const roleChanged =
    canEditRole &&
    !isOwnerMember &&
    role !== savedSnapshot.role &&
    role !== Role.OWNER;
  const hasChanges = patchDTO !== null || roleChanged;

  const handleSave = () => {
    if (!isFormValid) return;
    if (!hasChanges) return;
    if (isSaving) return;
    const dto: UpdateMemberDTO = { ...(patchDTO ?? {}) };
    if (roleChanged) dto.role = role;
    setIsSaving(true);
    updateMember.mutate(
      {
        guildId: member.guildId,
        memberId: member.memberId,
        dto,
      },
      {
        onSuccess: () => {
          setSavedSnapshot({
            alias: normalizedAlias,
            infoUrl: normalizedInfoUrl,
            role,
          });
        },
        onSettled: () => {
          setIsSaving(false);
        },
      },
    );
  };

  return (
    <PrimarySection minSize style={{ width: "25rem" }}>
      <Row justify="between" align="center">
        <NameTitle>{member.alias || member.user.name}</NameTitle>
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

      {updateMember.error && (
        <Error error={updateMember.error}>멤버 수정에 실패했습니다</Error>
      )}

      <Bar />

      <Scroll axis="y">
        <Column align="center" fill>
          <MemberCard
            member={{
              ...member,
              alias: alias || null,
              role,
            }}
          />
          <SecondarySection fill>
            <LabelInput
              label="별칭"
              value={alias}
              onValueChange={setAlias}
              placeholder={member.alias || member.name || member.user.name}
              disabled={!canEdit || isSaving}
            />
            <LabelInput
              label="정보 링크"
              value={infoUrl}
              onValueChange={setInfoUrl}
              disabled={!canEdit || isSaving}
            />
            <Column gap="xs">
              <Label>권한</Label>
              <TertiarySection>
                <Row wrap>
                  {roleEntries.map(({ key, displayName, color }) => (
                    <Toggle
                      key={key}
                      variantColor={color}
                      isPressed={role === key}
                      disabled={
                        !canEditRole ||
                        isOwnerMember ||
                        key === Role.OWNER ||
                        isSaving
                      }
                      onClick={() => setRole(key)}
                    >
                      {displayName}
                    </Toggle>
                  ))}
                </Row>
              </TertiarySection>
            </Column>
          </SecondarySection>
        </Column>
      </Scroll>
    </PrimarySection>
  );
}
