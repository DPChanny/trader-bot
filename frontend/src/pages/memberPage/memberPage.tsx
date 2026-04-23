import { useMemo, useState } from "preact/hooks";
import { useAuthGuard } from "@features/auth/hook";
import { useMembers } from "@features/member/hook";
import { MemberGrid } from "@components/memberGrid";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Page } from "@components/atoms/layout";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { MemberPanel } from "./memberPanel";
import { Title } from "@components/atoms/text";
import type { MemberDetailDTO } from "@features/member/dto";
import { useGuildId } from "@hooks/route";

export function MemberPage() {
  useAuthGuard();
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
