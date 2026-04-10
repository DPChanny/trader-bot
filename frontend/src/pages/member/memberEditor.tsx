import { useEffect, useState } from "preact/hooks";
import { MemberCard } from "@/components/memberCard";
import { useDeleteMember, useUpdateMember } from "@/hooks/member";
import { useGuildContext } from "@/contexts/guildContext";
import {
  CloseButton,
  DangerButton,
  SaveButton,
} from "@/components/commons/button";
import { LabelInput } from "@/components/commons/labelInput";
import { Error } from "@/components/commons/error";
import { Bar } from "@/components/commons/bar";
import { Section } from "@/components/commons/section";
import { ConfirmModal } from "@/components/commons/modal";
import type { MemberDetailDTO } from "@/dtos/memberDto";

import styles from "@/styles/components/memberEditor.module.css";

interface MemberEditorProps {
  member: MemberDetailDTO;
  onClose: () => void;
}

export function MemberEditor({ member, onClose }: MemberEditorProps) {
  const { guild } = useGuildContext();
  const guildId = guild?.discordId ?? null;
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();

  const [alias, setAlias] = useState(member.alias ?? "");
  const [infoUrl, setInfoUrl] = useState(member.infoUrl ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setAlias(member.alias ?? "");
    setInfoUrl(member.infoUrl ?? "");
  }, [member.memberId, member.alias, member.infoUrl]);

  const hasChanges =
    alias !== (member.alias ?? "") || infoUrl !== (member.infoUrl ?? "");

  const handleSave = async () => {
    if (!guildId) return;
    try {
      await updateMember.mutateAsync({
        guildId,
        memberId: member.memberId,
        dto: { alias: alias || null, infoUrl: infoUrl || null },
      });
    } catch (err) {
      console.error("Failed to update member:", err);
    }
  };

  const handleDeleteMember = async () => {
    if (!guildId) return;
    try {
      await deleteMember.mutateAsync({ guildId, memberId: member.memberId });
      onClose();
    } catch (err) {
      console.error("Failed to delete member:", err);
      setShowDeleteConfirm(false);
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
        {(updateMember.isError || deleteMember.isError) && (
          <>
            {updateMember.isError && (
              <Error detail={updateMember.error?.message}>
                멤버 정보 수정에 실패했습니다.
              </Error>
            )}
            {deleteMember.isError && (
              <Error detail={deleteMember.error?.message}>
                멤버 삭제에 실패했습니다.
              </Error>
            )}
          </>
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
        </Section>
      </Section>

      <Bar />

      <Section variantTone="ghost" variantIntent="secondary">
        <DangerButton
          variantSize="large"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteMember.isPending}
        >
          멤버 삭제
        </DangerButton>
      </Section>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteMember}
        title="멤버 삭제"
        message="정말 이 멤버를 삭제하시겠습니까?"
        confirmText="삭제"
        isPending={deleteMember.isPending}
      />
    </Section>
  );
}
