import { useEffect, useState } from "preact/hooks";
import { UserCard } from "@/components/userCard";
import { LolCard } from "@/components/lolCard";
import { ValCard } from "@/components/valCard";
import {
  useDeleteUser,
  useUpdateUser,
  useUpdateDiscordProfile,
} from "@/hooks/useUserApi";
import { useLolInfo } from "@/hooks/useLolApi";
import { useValInfo } from "@/hooks/useValApi";
import {
  Button,
  CloseButton,
  DangerButton,
  SaveButton,
} from "@/components/button";
import { LabelInput } from "@/components/labelInput";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { Section } from "@/components/section";
import { ConfirmModal } from "@/components/modal";
import { Loading } from "@/components/loading";
import type { User } from "@/dto";

import styles from "@/styles/pages/user/userEditor.module.css";

interface UserEditorProps {
  user: User;
  onClose: () => void;
}

export function UserEditor({ user, onClose }: UserEditorProps) {
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const updateDiscordProfile = useUpdateDiscordProfile();
  const lolInfo = useLolInfo(user.userId);
  const valInfo = useValInfo(user.userId);

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
    <Section variantType="primary" className={styles.panel}>
      <Section variantTone="ghost">
        <Section variantTone="ghost" variantLayout="row">
          <h3>{user.name}</h3>
          <Section
            variantTone="ghost"
            variantLayout="row"
            variantType="secondary"
          >
            <SaveButton
              onClick={handleSave}
              disabled={updateUser.isPending || !hasChanges}
            />
            <CloseButton onClick={onClose} />
          </Section>
        </Section>
        <Bar />

        {updateUser.isError && <Error>유저 정보 수정에 실패했습니다.</Error>}
        {deleteUser.isError && <Error>유저 삭제에 실패했습니다.</Error>}
        {updateDiscordProfile.isError && (
          <Error>Discord 프로필 업데이트에 실패했습니다.</Error>
        )}
      </Section>

      <div className={styles.content}>
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
              variantVariant="detail"
            />
          </Section>

          <LabelInput label="이름" value={name} onChange={setName} />
          <LabelInput label="Riot ID" value={riotId} onChange={setRiotId} />
          <LabelInput
            label="Discord ID"
            value={discordId}
            onChange={setDiscordId}
          />

          <Button
            onClick={handleUpdateDiscordProfile}
            disabled={updateDiscordProfile.isPending || !user.discordId}
          >
            {updateDiscordProfile.isPending
              ? "업데이트 중..."
              : "Discord 프로필 업데이트"}
          </Button>

          <Bar />

          {lolInfo.isLoading ? (
            <Loading />
          ) : lolInfo.data ? (
            <LolCard lolDto={lolInfo.data} />
          ) : (
            <Error>LOL 통계를 불러오지 못했습니다.</Error>
          )}

          <Bar />

          {valInfo.isLoading ? (
            <Loading />
          ) : valInfo.data ? (
            <ValCard valDto={valInfo.data} />
          ) : (
            <Error>VAL 통계를 불러오지 못했습니다.</Error>
          )}
        </Section>
      </div>

      <Section variantTone="ghost" className={styles.footer}>
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
