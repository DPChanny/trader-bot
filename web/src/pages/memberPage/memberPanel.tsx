import { useEffect, useState } from "preact/hooks";
import { MemberCard } from "@/components/memberCard";
import { useUpdateMember } from "@/hooks/member";
import { CloseButton, SaveButton } from "@/components/commons/button";
import { LabelInput } from "@/components/commons/labelInput";
import { Error } from "@/components/commons/error";
import { Bar } from "@/components/commons/bar";
import { Section } from "@/components/commons/section";
import { Toggle } from "@/components/commons/toggle";
import {
  UpdateMemberSchema,
  type MemberDetailDTO,
  type UpdateMemberDTO,
} from "@/dtos/memberDto";
import { Role } from "@/dtos/memberDto";
import { useVerifyRole } from "@/hooks/member";
import { buildPatchDto } from "@/utils/dto";

import styles from "@/styles/pages/memberPage/memberPanel.module.css";

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
    <Section variantIntent="primary" className={styles.panelSection}>
      <Section variantTone="ghost" variantIntent="secondary">
        <Section
          variantTone="ghost"
          variantLayout="row"
          variantIntent="secondary"
        >
          <h3>{member.alias || member.user.name}</h3>
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantIntent="secondary"
          >
            {canEdit && (
              <SaveButton
                onClick={handleSave}
                disabled={updateMember.isPending || !hasChanges || !isFormValid}
              />
            )}
            <CloseButton onClick={onClose} />
          </Section>
        </Section>
        {updateMember.isError && (
          <Error error={updateMember.error}>멤버 수정에 실패했습니다.</Error>
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
            <MemberCard
              member={{
                ...member,
                alias: alias || null,
                role,
              }}
            />
          </Section>

          <LabelInput
            label="별칭"
            value={alias}
            onChange={setAlias}
            placeholder={member.alias || member.name || member.user.name}
            disabled={!canEdit}
          />
          <LabelInput
            label="프로필 링크"
            value={infoUrl}
            onChange={setInfoUrl}
            disabled={!canEdit}
          />
          {infoUrl && (
            <a href={infoUrl} target="_blank" rel="noopener noreferrer">
              프로필 보기 →
            </a>
          )}

          <Section variantTone="ghost" variantIntent="secondary">
            <span>권한</span>
            <Section
              variantIntent="tertiary"
              variantLayout="row"
              className={styles.toggleSection}
            >
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
                  isActive={role === value}
                  disabled={!canEditRole || value === 3}
                  onClick={() => setRole(value)}
                >
                  {label}
                </Toggle>
              ))}
            </Section>
          </Section>
        </Section>
      </Section>
    </Section>
  );
}
