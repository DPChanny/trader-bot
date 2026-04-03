import { useState, useMemo, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { useMembers, useAddMember } from "@/hooks/member";
import { getGuild } from "@/utils/guild";
import { PrimaryButton } from "@/components/commons/button";
import { MemberGrid } from "@/components/memberGrid";
import { Section } from "@/components/commons/section";
import { PageLayout, PageContainer } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { MemberEditor } from "./memberEditor";
import { AddMemberModal } from "./addMemberModal";
import type { MemberDTO } from "@/dtos/memberDto";

import styles from "@/styles/pages/member/memberPage.module.css";
import { Bar } from "@/components/commons/bar";

interface MemberPageProps {
  path?: string;
}

export function MemberPage({}: MemberPageProps) {
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
        ? members.find((m: MemberDTO) => m.memberId === selectedMemberId)
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
            <MemberGrid
              members={members || []}
              selectedMemberId={selectedMemberId}
              onMemberClick={(id) => setSelectedMemberId(id as number)}
            />
          )}
        </Section>

        {selectedMember && (
          <MemberEditor
            member={selectedMember}
            guildId={guildId!}
            onClose={handleCloseEditor}
          />
        )}
      </PageContainer>

      <AddMemberModal
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
