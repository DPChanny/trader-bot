import { MemberCard } from "./memberCard";
import { Button } from "./atoms/button";
import { Row, Scroll } from "./atoms/layout";
import type { MemberDetailDTO } from "@features/member/dto";
import { TertiarySection } from "./surfaces/section";
import { useInfiniteScroll } from "@hooks/useInfiniteScroll";

interface MemberGridProps {
  members: MemberDetailDTO[];
  onClick?: (memberId: number) => void;
  selectedMemberId?: number | null;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
}

export function MemberGrid({
  members,
  onClick,
  selectedMemberId,
  fetchNextPage,
  hasNextPage,
}: MemberGridProps) {
  const { scrollRef, onScroll } = useInfiniteScroll(
    fetchNextPage ?? (() => {}),
    hasNextPage ?? false,
    [members],
  );

  return (
    <TertiarySection minSize fill>
      <Scroll axis="both" ref={scrollRef} onScroll={onScroll}>
        <Row wrap centerOnWrap>
          {members.map((member) => {
            const isSelected = selectedMemberId === member.memberId;
            return (
              <Button
                key={member.memberId}
                variantTone="ghost"
                onClick={onClick ? () => onClick(member.memberId) : undefined}
                isPressed={isSelected}
              >
                <MemberCard member={member} />
              </Button>
            );
          })}
        </Row>
      </Scroll>
    </TertiarySection>
  );
}
