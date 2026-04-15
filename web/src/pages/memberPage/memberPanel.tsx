import { useEffect, useState } from "preact/hooks";
import { MemberCard } from "@/components/memberCard";
import { useUpdateMember } from "@/hooks/member";
import { CloseButton, SaveButton } from "@/components/commons/button";
import { Link } from "@/components/commons/link";
import { LabelInput } from "@/components/commons/labelInput";
import { ErrorMessage } from "@/components/commons/errorMessage";
import { Bar } from "@/components/commons/bar";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@/components/commons/section";
import { Column, Row, Scroll } from "@/components/commons/layout";
import { Toggle } from "@/components/commons/toggle";
import {
  UpdateMemberSchema,
  type MemberDetailDTO,
  type UpdateMemberDTO,
} from "@/dtos/member";
import { Role } from "@/dtos/member";
import { useVerifyRole } from "@/hooks/member";
import { buildPatchDto } from "@/utils/dto";

interface MemberPanelProps {
  member: MemberDetailDTO;
  onClose: () => void;
}

export function MemberPanel({ member, onClose }: MemberPanelProps) {
  const updateMember = useUpdateMember();

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

  const handleSave = async () => {
    if (!isFormValid) return;
    if (!hasChanges) return;
    const dto: UpdateMemberDTO = { ...basePatchDto };
    if (roleChanged) dto.role = role;
    try {
      await updateMember.mutateAsync({
        guildId: member.guildId,
        memberId: member.memberId,
        dto,
      });
    } catch (err) {
      console.error("Failed to update member:", err);
    }
  };

  return (
    <PrimarySection minSize style={{ width: "24rem", flex: "none" }}>
      <SecondarySection>
        <Column>
          <Row>
            <h3>{member.alias || member.user.name}</h3>
            <Row>
              {canEdit && (
                <SaveButton
                  onClick={handleSave}
                  disabled={
                    updateMember.isPending || !hasChanges || !isFormValid
                  }
                />
              )}
              <CloseButton onClick={onClose} />
            </Row>
          </Row>
          {updateMember.isError && (
            <ErrorMessage error={updateMember.error}>
              멤버 수정에 실패했습니다.
            </ErrorMessage>
          )}
        </Column>
      </SecondarySection>

      <Bar />

      <Scroll axis="y">
        <Column>
          <Column align="center">
            <MemberCard
              member={{
                ...member,
                alias: alias || null,
                role,
              }}
            />
          </Column>

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
              프로필 보기 →
            </Link>
          )}

          <SecondarySection>
            <span>권한</span>
            <TertiarySection>
              <Row wrap>
                {(
                  [
                    { value: 0, label: "VIEWER" },
                    { value: 1, label: "EDITOR" },
                    { value: 2, label: "ADMIN" },
                    { value: 3, label: "OWNER" },
                  ] as const
                ).map(({ value, label }) => (
                  <Toggle
                    key={value}
                    variantColor={
                      value === 3 ? "gold" : value === 2 ? "red" : "blue"
                    }
                    isPressed={role === value}
                    disabled={!canEditRole || value === 3}
                    onClick={() => setRole(value)}
                  >
                    {label}
                  </Toggle>
                ))}
              </Row>
            </TertiarySection>
          </SecondarySection>
        </Column>
      </Scroll>
    </PrimarySection>
  );
}
