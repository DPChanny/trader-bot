import { useMemo } from "preact/hooks";
import { useMembers } from "@/hooks/member";
import { useMemberPageContext, MemberPageProvider } from "./memberContext";
import { MemberGrid } from "@/components/memberGrid";
import { Section } from "@/components/commons/section";
import { PageLayout, PageContainer } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { MemberPanel } from "./memberPanel";
import type { MemberDetailDTO } from "@/dtos/memberDto";

import styles from "@/styles/pages/member/memberPage.module.css";
import { Bar } from "@/components/commons/bar";

interface MemberPageProps {
  guildId: string;
}

function MemberPageContent({ guildId }: MemberPageProps) {
  const { selectedMemberId, setSelectedMemberId } = useMemberPageContext();

  const { data: members, isLoading, error } = useMembers(guildId);

  const sortedMembers = useMemo(
    () =>
      members
        ? [...members].sort(
            (a: MemberDetailDTO, b: MemberDetailDTO) => b.role - a.role,
          )
        : [],
    [members],
  );

  const selectedMember = useMemo(
    () =>
      selectedMemberId && members
        ? members.find((m: MemberDetailDTO) => m.memberId === selectedMemberId)
        : null,
    [selectedMemberId, members],
  );

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
              members={sortedMembers}
              selectedMemberId={selectedMemberId}
              onMemberClick={setSelectedMemberId}
            />
          )}
        </Section>

        {selectedMember && (
          <MemberPanel
            guildId={guildId}
            member={selectedMember}
            onClose={() => setSelectedMemberId(null)}
          />
        )}
      </PageContainer>
    </PageLayout>
  );
}

export function MemberEditor({ guildId }: MemberPageProps) {
  return (
    <MemberPageProvider>
      <MemberPageContent guildId={guildId} />
    </MemberPageProvider>
  );
}
