import { useMemo, useEffect } from "preact/hooks";
import { route } from "preact-router";
import { useMembers } from "@/hooks/member";
import { useGuildContext } from "@/contexts/guildContext";
import { useMemberPageContext, MemberPageProvider } from "./memberContext";
import { MemberGrid } from "@/components/memberGrid";
import { Section } from "@/components/commons/section";
import { PageLayout, PageContainer } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { MemberEditor } from "./memberEditor";
import type { MemberDetailDTO } from "@/dtos/memberDto";

import styles from "@/styles/pages/member/memberPage.module.css";
import { Bar } from "@/components/commons/bar";

interface MemberPageProps {
  path?: string;
}

function MemberPageContent() {
  const { guild } = useGuildContext();
  const guildId = guild?.discordId ?? null;
  const { selectedMemberId, setSelectedMemberId } = useMemberPageContext();

  const { data: members, isLoading, error } = useMembers(guildId);

  const selectedMember = useMemo(
    () =>
      selectedMemberId && members
        ? members.find((m: MemberDetailDTO) => m.memberId === selectedMemberId)
        : null,
    [selectedMemberId, members],
  );

  useEffect(() => {
    if (!guild) {
      route("/guild", true);
    }
  }, []);

  if (!guild) return null;

  return (
    <PageLayout>
      <PageContainer>
        <Section variantIntent="primary" className={styles.mainSection}>
          <Section variantTone="ghost" variantLayout="row">
            <h3>멤버 목록</h3>
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
              members={members ?? []}
              selectedMemberId={selectedMemberId}
              onMemberClick={setSelectedMemberId}
            />
          )}
        </Section>

        {selectedMember && (
          <MemberEditor
            member={selectedMember}
            onClose={() => setSelectedMemberId(null)}
          />
        )}
      </PageContainer>
    </PageLayout>
  );
}

export function MemberPage({}: MemberPageProps) {
  return (
    <MemberPageProvider>
      <MemberPageContent />
    </MemberPageProvider>
  );
}
