import { useParams } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useInfiniteMembers } from "@features/member/hook";
import { MemberGrid } from "@components/memberGrid";
import {
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { MemberPanel } from "./memberPanel";
import { Title } from "@components/atoms/text";
import { Row, Fill } from "@components/atoms/layout";
import { Input } from "@components/atoms/input";
import type { MemberDetailDTO } from "@features/member/dto";

export function MemberEditor() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };

  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, error, fetchNextPage, hasNextPage } =
    useInfiniteMembers(guildId, search || undefined);

  const members = useMemo(
    () => data?.pages.flatMap((p) => p.items) ?? [],
    [data],
  );

  const selectedMember = useMemo(
    () =>
      selectedMemberId !== null
        ? (members.find(
            (m: MemberDetailDTO) => m.memberId === selectedMemberId,
          ) ?? null)
        : null,
    [selectedMemberId, members],
  );

  return (
    <>
      <Fill overflow="hidden">
        <SecondarySection fill>
          <Row gap="sm" align="center" justify="between">
            <Title>멤버 목록</Title>
            <Input
              value={searchInput}
              onValueChange={setSearchInput}
              placeholder="이름 검색"
            />
          </Row>
          {error ? (
            <TertiarySection fill>
              <Error error={error}>멤버 목록을 불러오지 못했습니다</Error>
            </TertiarySection>
          ) : isLoading ? (
            <TertiarySection fill>
              <Loading />
            </TertiarySection>
          ) : (
            <MemberGrid
              members={members}
              selectedMemberId={selectedMemberId}
              onClick={setSelectedMemberId}
              fetchNextPage={fetchNextPage}
              hasNextPage={hasNextPage ?? false}
            />
          )}
        </SecondarySection>
      </Fill>

      {selectedMember && (
        <MemberPanel
          member={selectedMember}
          onClose={() => setSelectedMemberId(null)}
        />
      )}
    </>
  );
}
