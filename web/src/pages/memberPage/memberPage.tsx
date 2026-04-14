import { useMemo, useState } from "preact/hooks";
import { useMembers } from "@/hooks/member";
import { MemberGrid } from "@/components/memberGrid";
import { Section } from "@/components/commons/section";
import { PageLayout } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { MemberPanel } from "./memberPanel";
import type { MemberDetailDTO } from "@/dtos/member";

import styles from "@/styles/pages/memberPage/memberPage.module.css";
import { Bar } from "@/components/commons/bar";

interface MemberPageProps {
  guildId: string;
}

export function MemberPage({ guildId }: MemberPageProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

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
      selectedMemberId !== null && members
        ? members.find((m: MemberDetailDTO) => m.memberId === selectedMemberId)
        : null,
    [selectedMemberId, members],
  );

  return (
    <PageLayout>
      <Section variantIntent="primary" className={styles.mainSection}>
        <Section variantTone="ghost" variantLayout="row">
          <h3>멤버 목록</h3>
        </Section>
        <Bar />
        <Section variantTone="ghost" variantIntent="secondary">
          {error ? (
            <Error error={error}>멤버 목록을 불러오는데 실패했습니다.</Error>
          ) : isLoading ? (
            <Loading />
          ) : (
            <MemberGrid
              members={sortedMembers}
              selectedMemberId={selectedMemberId}
              onMemberClick={setSelectedMemberId}
            />
          )}
        </Section>
      </Section>

      {selectedMember && (
        <MemberPanel
          member={selectedMember}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </PageLayout>
  );
}
