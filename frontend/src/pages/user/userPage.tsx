import { useState, useMemo, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { useMembers, useAddMember } from "@/hooks/member";
import { getGuild } from "@/utils/guild";
import { PrimaryButton } from "@/components/button";
import { UserGrid } from "@/components/userGrid";
import { Section } from "@/components/section";
import { PageLayout, PageContainer } from "@/components/page";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { UserEditor } from "./userEditor";
import { AddUserModal } from "./addUserModal";
import type { MemberDTO } from "@/dtos";

import styles from "@/styles/pages/user/userPage.module.css";
import { Bar } from "@/components/bar";

interface UserPageProps {
  path?: string;
}

export function UserPage({}: UserPageProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    alias: "",
    riotId: "",
    discordId: "",
  });

  const selectedGuild = getGuild();
  const guildId = selectedGuild?.guildId ?? null;

  useEffect(() => {
    if (!selectedGuild) {
      route("/guild", true);
    }
  }, []);

  const { data: members, isLoading, error } = useMembers(guildId ?? 0);
  const addMember = useAddMember();

  const selectedMember = useMemo(
    () =>
      selectedMemberId && members
        ? members.find((m: Member) => m.memberId === selectedMemberId)
        : null,
    [selectedMemberId, members],
  );

  const handleCloseEditor = () => {
    setSelectedMemberId(null);
  };

  const handleOpenModal = () => {
    setFormData({ alias: "", riotId: "", discordId: "" });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ alias: "", riotId: "", discordId: "" });
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!guildId) return;
    try {
      await addMember.mutateAsync({ guildId, dto: formData });
      handleCloseModal();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  if (!selectedGuild) return null;

  return (
    <PageLayout>
      <PageContainer>
        <Section variantIntent="primary" className={styles.mainSection}>
          <Section variantTone="ghost" variantLayout="row">
            <h3>멤버 목록</h3>
            <PrimaryButton onClick={handleOpenModal}>추가</PrimaryButton>
          </Section>
          <Bar />
          {error && (
            <Error detail={error?.message}>
              멤버 목록을 불러오는데 실패했습니다.
            </Error>
          )}
          {isLoading && <Loading />}
          {!isLoading && !error && (
            <UserGrid
              members={members || []}
              selectedMemberId={selectedMemberId}
              onMemberClick={(id) => setSelectedMemberId(id as number)}
            />
          )}
        </Section>

        {selectedMember && (
          <UserEditor
            member={selectedMember}
            guildId={guildId!}
            onClose={handleCloseEditor}
          />
        )}
      </PageContainer>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        formData={formData}
        onFormChange={handleFormChange}
        isPending={addMember.isPending}
        error={addMember.error}
      />
    </PageLayout>
  );
}
