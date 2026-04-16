import { useEffect, useState } from "preact/hooks";
import { MemberCard } from "@components/memberCard";
import { useUpdateMember } from "@hooks/member";
import { CloseButton, SaveButton } from "@components/atoms/button";
import { Link } from "@components/atoms/link";
import { LabelInput } from "@components/molecules/labelInput";
import { Error } from "@components/molecules/error";
import { normalizeError } from "@utils/error";
import { Bar } from "@components/atoms/bar";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { Column, Row, Scroll } from "@components/atoms/layout";
import { Toggle } from "@components/molecules/toggle";
import { Label, NameTitle } from "@components/atoms/text";
import {
  UpdateMemberSchema,
  type MemberDetailDTO,
  type UpdateMemberDTO,
} from "@dtos/member";
import { Role } from "@dtos/member";
import { useVerifyRole } from "@hooks/member";
import { buildPatchDto } from "@utils/dto";
import { getRoleEntries } from "@utils/enum";

interface MemberPanelProps {
  member: MemberDetailDTO;
  onClose: () => void;
}

export function MemberPanel({ member, onClose }: MemberPanelProps) {
  const updateMember = useUpdateMember();
  const roleEntries = Object.values(getRoleEntries());

  const [alias, setAlias] = useState(member.alias ?? "");
  const [infoUrl, setInfoUrl] = useState(member.infoUrl ?? "");
  const [role, setRole] = useState(member.role);

  useEffect(() => {
    setAlias(member.alias ?? "");
    setInfoUrl(member.infoUrl ?? "");
    setRole(member.role);
  }, [member.memberId, member.alias, member.infoUrl, member.role]);

  const canEdit = useVerifyRole(member.guildId, Role.EDITOR);
  const canEditRole = useVerifyRole(member.guildId, Role.ADMIN);

  const parseResult = UpdateMemberSchema.safeParse({ alias, infoUrl });
  const isFormValid = parseResult.success;
  const basePatchDto = parseResult.success
    ? buildPatchDto(
        {
          alias: parseResult.data.alias ?? null,
          infoUrl: parseResult.data.infoUrl ?? null,
        },
        { alias: member.alias, infoUrl: member.infoUrl },
      )
    : null;
  const roleChanged =
    canEditRole && role !== member.role && role !== Role.OWNER;
  const hasChanges = basePatchDto !== null || roleChanged;

  const handleSave = () => {
    if (!isFormValid) return;
    if (!hasChanges) return;
    const dto: UpdateMemberDTO = { ...basePatchDto };
    if (roleChanged) dto.role = role;
    updateMember.mutate({
      guildId: member.guildId,
      memberId: member.memberId,
      dto,
    });
  };

  return (
    <PrimarySection minSize style={{ width: "24rem" }}>
      <Row justify="between" align="center">
        <NameTitle>{member.alias || member.user.name}</NameTitle>
        <Row gap="sm" align="center">
          {canEdit && (
            <SaveButton
              onClick={handleSave}
              disabled={updateMember.isPending || !hasChanges || !isFormValid}
            />
          )}
          <CloseButton onClick={onClose} />
        </Row>
      </Row>

      {updateMember.isError && updateMember.error && (
        <Error error={normalizeError(updateMember.error)} />
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
              disabled={!canEdit}
            />
            <LabelInput
              label="프로필 링크"
              value={infoUrl}
              onValueChange={setInfoUrl}
              disabled={!canEdit}
            />
            {infoUrl && (
              <Link href={infoUrl} target="_blank" rel="noopener noreferrer">
                프로필 보기
              </Link>
            )}

            <Column gap="xs">
              <Label>권한</Label>
              <TertiarySection>
                <Row wrap>
                  {roleEntries.map(({ key, displayName, color }) => (
                    <Toggle
                      key={key}
                      variantColor={color}
                      isPressed={role === key}
                      disabled={!canEditRole || key === Role.OWNER}
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
