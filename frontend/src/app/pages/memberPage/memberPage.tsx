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
import { useGuildId } from "@hooks/router";

export function MemberPage() {
  const guildId = useGuildId();
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  const members = useMembers(guildId);

  const sortedMembers = useMemo(
    () =>
      members.data
        ? [...members.data].sort(
            (a: MemberDetailDTO, b: MemberDetailDTO) => b.role - a.role,
          )
        : [],
    [members.data],
  );

  const selectedMember = useMemo(
    () =>
      selectedMemberId !== null && members.data
        ? members.data.find(
            (m: MemberDetailDTO) => m.memberId === selectedMemberId,
          )
        : null,
    [selectedMemberId, members.data],
  );

  return (
    <Page>
      <PrimarySection fill>
        <SecondarySection fill>
          <Title>멤버 목록</Title>
          {members.error ? (
            <TertiarySection fill>
              <Error error={members.error}>
                멤버 목록을 불러오지 못했습니다
              </Error>
            </TertiarySection>
          ) : members.isLoading ? (
            <TertiarySection fill>
              <Loading />
            </TertiarySection>
          ) : (
            <MemberGrid
              members={sortedMembers}
              selectedMemberId={selectedMemberId}
              onClick={setSelectedMemberId}
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
