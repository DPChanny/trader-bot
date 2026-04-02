import { useEffect, useState } from "preact/hooks";
import { UserCard } from "@/components/userCard";
import { LolStat } from "@/components/lolStat";
import { ValStat } from "@/components/valStat";
import {
  useDeleteMember,
  useUpdateMember,
  useUpdateMemberProfile,
} from "@/hooks/member";
import { useLolStat } from "@/hooks/lolStat";
import { useValStat } from "@/hooks/valStat";
import {
  CloseButton,
  DangerButton,
  PrimaryButton,
  SaveButton,
} from "@/components/button";
import { LabelInput } from "@/components/labelInput";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { Section } from "@/components/section";
import { ConfirmModal } from "@/components/modal";
import { Loading } from "@/components/loading";
import type { MemberDTO } from "@/dtos";

import styles from "@/styles/components/userEditor.module.css";
import { Label } from "@/components/label";

interface UserEditorProps {
  member: MemberDTO;
  guildId: number;
  onClose: () => void;
}

export function UserEditor({ member, guildId, onClose }: UserEditorProps) {
  const updateMember = useUpdateMember();
  const deleteMember = useDeleteMember();
  const updateProfile = useUpdateMemberProfile();
  const lolStat = useLolStat(member.memberId);
  const valStat = useValStat(member.memberId);

  const [alias, setAlias] = useState(member.alias ?? "");
  const [riotId, setRiotId] = useState(member.riotId ?? "");
  const [discordId, setDiscordId] = useState(member.discordId ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setAlias(member.alias ?? "");
    setRiotId(member.riotId ?? "");
    setDiscordId(member.discordId ?? "");
  }, [member.memberId, member.alias, member.riotId, member.discordId]);

  const hasChanges =
    alias !== (member.alias ?? "") ||
    riotId !== (member.riotId ?? "") ||
    discordId !== (member.discordId ?? "");

  const handleSave = async () => {
    try {
      await updateMember.mutateAsync({
        guildId,
        memberId: member.memberId,
        data: { alias, riotId, discordId },
      });
    } catch (err) {
      console.error("Failed to update member:", err);
    }
  };

  const handleDeleteMember = async () => {
    try {
      await deleteMember.mutateAsync({ guildId, memberId: member.memberId });
      onClose();
    } catch (err) {
      console.error("Failed to delete member:", err);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateProfile.mutateAsync({ guildId, memberId: member.memberId });
    } catch (err) {
      console.error("Failed to update profile:", err);
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
          <h3>{member.alias || "이름 없음"}</h3>
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
        {(updateMember.isError ||
          deleteMember.isError ||
          updateProfile.isError) && (
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
            {updateProfile.isError && (
              <Error detail={updateProfile.error?.message}>
                프로필 업데이트에 실패했습니다.
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
            <UserCard
              member={{
                memberId: member.memberId,
                guildId: member.guildId,
                alias: alias || null,
                riotId: riotId || null,
                discordId: discordId || null,
                profileUrl: member.profileUrl,
              }}
            />
          </Section>

          <LabelInput label="이름" value={alias} onChange={setAlias} />
          <LabelInput label="Riot ID" value={riotId} onChange={setRiotId} />
          <LabelInput
            label="Discord ID"
            value={discordId}
            onChange={setDiscordId}
          />

          <PrimaryButton
            onClick={handleUpdateProfile}
            disabled={updateProfile.isPending || !member.discordId}
          >
            {updateProfile.isPending ? "업데이트 중..." : "프로필 업데이트"}
          </PrimaryButton>

          <Label>League of Legends 통계</Label>
          {lolStat.isLoading ? (
            <Loading />
          ) : lolStat.data ? (
            <LolStat lolStatDTO={lolStat.data} />
          ) : (
            <Error detail={lolStat.error?.message}>
              통계를 불러오지 못했습니다.
            </Error>
          )}

          <Label>VALORANT 통계</Label>
          {valStat.isLoading ? (
            <Loading />
          ) : valStat.data ? (
            <ValStat valStatDTO={valStat.data} />
          ) : (
            <Error detail={valStat.error?.message}>
              통계를 불러오지 못했습니다.
            </Error>
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
