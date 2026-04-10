import { useEffect, useState } from "preact/hooks";
import { MemberCard } from "@/components/memberCard";
import { useUpdateMember } from "@/hooks/member";
import { CloseButton, SaveButton } from "@/components/commons/button";
import { LabelInput } from "@/components/commons/labelInput";
import { Error } from "@/components/commons/error";
import { Bar } from "@/components/commons/bar";
import { Section } from "@/components/commons/section";
import { Toggle } from "@/components/commons/toggle";
import type { MemberDetailDTO } from "@/dtos/memberDto";

import styles from "@/styles/pages/guild/memberEditor.module.css";

interface MemberPanelProps {
  guildId: string;
  member: MemberDetailDTO;
  onClose: () => void;
}

export function MemberPanel({ guildId, member, onClose }: MemberPanelProps) {
  const updateMember = useUpdateMember();

  const [alias, setAlias] = useState(member.alias ?? "");
  const [infoUrl, setInfoUrl] = useState(member.infoUrl ?? "");
  const [role, setRole] = useState(member.role);

  useEffect(() => {
    setAlias(member.alias ?? "");
    setInfoUrl(member.infoUrl ?? "");
    setRole(member.role);
  }, [member.memberId, member.alias, member.infoUrl, member.role]);

  const hasChanges =
    alias !== (member.alias ?? "") ||
    infoUrl !== (member.infoUrl ?? "") ||
    role !== member.role;

  const handleSave = async () => {
    try {
      await updateMember.mutateAsync({
        guildId,
        memberId: member.memberId,
        dto: { alias: alias || null, infoUrl: infoUrl || null, role },
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
          <h3>{member.alias || member.discordUser.name}</h3>
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantIntent="secondary"
          >
            <SaveButton
              onClick={handleSave}
              disabled={updateMember.isPending || !hasChanges}
            />
            <CloseButton onClick={onClose} />
          </Section>
        </Section>
        {updateMember.isError && (
          <Error detail={updateMember.error?.message}>
            멤버 정보 수정에 실패했습니다.
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
            <MemberCard
              member={{
                ...member,
                alias: alias || null,
                role,
              }}
            />
          </Section>

          <LabelInput
            label="별칭 (Alias)"
            value={alias}
            onChange={setAlias}
            placeholder={member.alias || member.name || member.discordUser.name}
          />
          <LabelInput
            label="프로필 링크"
            value={infoUrl}
            onChange={setInfoUrl}
            placeholder="https://op.gg/..."
          />
          {infoUrl && (
            <a href={infoUrl} target="_blank" rel="noopener noreferrer">
              프로필 보기 →
            </a>
          )}

          <Section variantTone="ghost" variantIntent="secondary">
            <span>권한</span>
            <Section
              variantTone="ghost"
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
