import { useMemo, useState } from "preact/hooks";
import { useMembers } from "@/hooks/member";
import { MemberGrid } from "@/components/memberGrid";
import { PrimarySection } from "@/components/molecules/section";
import { Page } from "@/components/atoms/layout";
import { Loading } from "@/components/molecules/loading";
import { ErrorMessage } from "@/components/molecules/errorMessage";
import { MemberPanel } from "./memberPanel";
import type { MemberDetailDTO } from "@/dtos/member";

import { Bar } from "@/components/atoms/bar";

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
    <Page>
      <PrimarySection minSize style={{ flex: 4 }}>
        <h3>멤버 목록</h3>
        <Bar />
        {error ? (
          <ErrorMessage error={error}>
            멤버 목록을 불러오는데 실패했습니다.
          </ErrorMessage>
        ) : isLoading ? (
          <Loading />
        ) : (
          <MemberGrid
            members={sortedMembers}
            selectedMemberId={selectedMemberId}
            onMemberClick={setSelectedMemberId}
          />
        )}
      </PrimarySection>

      {selectedMember && (
        <MemberPanel
          member={selectedMember}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </Page>
  );
}
