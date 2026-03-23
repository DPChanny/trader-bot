import { useEffect, useState } from "preact/hooks";
import { UserCard } from "@/components/userCard";
import { LolStat } from "@/components/lolStat";
import { ValStat } from "@/components/valStat";
import {
  useDeleteUser,
  useUpdateUser,
  useUpdateDiscordProfile,
} from "@/hooks/user";
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
import type { User } from "@/dto";

import styles from "@/styles/components/userEditor.module.css";
import { Label } from "@/components/label";

interface UserEditorProps {
  user: User;
  onClose: () => void;
}

export function UserEditor({ user, onClose }: UserEditorProps) {
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const updateDiscordProfile = useUpdateDiscordProfile();
  const lolStat = useLolStat(user.userId);
  const valStat = useValStat(user.userId);

  const [name, setName] = useState(user.name);
  const [riotId, setRiotId] = useState(user.riotId);
  const [discordId, setDiscordId] = useState(user.discordId);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setName(user.name);
    setRiotId(user.riotId);
    setDiscordId(user.discordId);
  }, [user.userId, user.name, user.riotId, user.discordId]);

  const hasChanges =
    name !== user.name ||
    riotId !== user.riotId ||
    discordId !== user.discordId;

  const handleSave = async () => {
    try {
      await updateUser.mutateAsync({
        userId: user.userId,
        data: {
          name,
          riotId,
          discordId,
        },
      });
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteUser.mutateAsync(user.userId);
      onClose();
    } catch (err) {
      console.error("Failed to delete user:", err);
      setShowDeleteConfirm(false);
    }
  };

  const handleUpdateDiscordProfile = async () => {
    try {
      await updateDiscordProfile.mutateAsync(user.userId);
    } catch (err) {
      console.error("Failed to update discord profile:", err);
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
          <h3>{user.name}</h3>
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantIntent="secondary"
          >
            <SaveButton
              onClick={handleSave}
              disabled={updateUser.isPending || !hasChanges}
            />
            <CloseButton onClick={onClose} />
          </Section>
        </Section>
        {(updateUser.isError ||
          deleteUser.isError ||
          updateDiscordProfile.isError) && (
          <>
            {updateUser.isError && (
              <Error>유저 정보 수정에 실패했습니다.</Error>
            )}
            {deleteUser.isError && <Error>유저 삭제에 실패했습니다.</Error>}
            {updateDiscordProfile.isError && (
              <Error>Discord 프로필 업데이트에 실패했습니다.</Error>
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
              user={{
                userId: user.userId,
                name: name,
                riotId: riotId,
                discordId: discordId,
                discordProfileUrl: user.discordProfileUrl,
              }}
            />
          </Section>

          <LabelInput label="이름" value={name} onChange={setName} />
          <LabelInput label="Riot ID" value={riotId} onChange={setRiotId} />
          <LabelInput
            label="Discord ID"
            value={discordId}
            onChange={setDiscordId}
          />

          <PrimaryButton
            onClick={handleUpdateDiscordProfile}
            disabled={updateDiscordProfile.isPending || !user.discordId}
          >
            {updateDiscordProfile.isPending
              ? "업데이트 중..."
              : "Discord 프로필 업데이트"}
          </PrimaryButton>

          <Label>League of Legends 통계</Label>
          {lolStat.isLoading ? (
            <Loading />
          ) : lolStat.data ? (
            <LolStat lolStatDto={lolStat.data} />
          ) : (
            <Error>통계를 불러오지 못했습니다.</Error>
          )}

          <Label>VALORANT 통계</Label>
          {valStat.isLoading ? (
            <Loading />
          ) : valStat.data ? (
            <ValStat valStatDto={valStat.data} />
          ) : (
            <Error>통계를 불러오지 못했습니다.</Error>
          )}
        </Section>
      </Section>

      <Bar />

      <Section variantTone="ghost" variantIntent="secondary">
        <DangerButton
          variantSize="large"
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteUser.isPending}
        >
          유저 삭제
        </DangerButton>
      </Section>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteUser}
        title="유저 삭제"
        message="정말 이 유저를 삭제하시겠습니까?"
        confirmText="삭제"
        isPending={deleteUser.isPending}
      />
    </Section>
  );
}
