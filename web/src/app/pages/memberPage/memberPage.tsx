import { useMemo, useState } from "preact/hooks";
import { useMembers } from "@hooks/member";
import { MemberGrid } from "@components/memberGrid";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/molecules/section";
import { Page } from "@components/atoms/layout";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { MemberPanel } from "./memberPanel";
import { Title } from "@components/atoms/text";
import type { MemberDetailDTO } from "@dtos/member";

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
      <PrimarySection fill>
        <SecondarySection fill>
          <Title>멤버 목록</Title>
          {error ? (
            <TertiarySection fill>
              <Error error={error} />
            </TertiarySection>
          ) : isLoading ? (
            <TertiarySection fill>
              <Loading />
            </TertiarySection>
          ) : (
            <MemberGrid
              members={sortedMembers}
              selectedMemberId={selectedMemberId}
              onMemberClick={setSelectedMemberId}
            />
          )}
        </SecondarySection>
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
