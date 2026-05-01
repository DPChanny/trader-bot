import { PresetMemberCard } from "./presetMemberCard";
import { Button } from "./atoms/button";
import { Row, Scroll } from "./atoms/layout";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";
import { TertiarySection } from "./surfaces/section";
import { useInfiniteScroll } from "@hooks/useInfiniteScroll";

interface PresetMemberGridProps {
  presetMembers: PresetMemberDetailDTO[];
  selectedMemberId?: number | null;
  onClick?: (
    presetMember: PresetMemberDetailDTO,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
}

export function PresetMemberGrid({
  presetMembers,
  selectedMemberId,
  onClick,
  fetchNextPage,
  hasNextPage,
}: PresetMemberGridProps) {
  const { scrollRef, onScroll } = useInfiniteScroll(
    fetchNextPage ?? (() => {}),
    hasNextPage ?? false,
    [presetMembers],
  );

  const leaders = presetMembers.filter((pm) => pm.isLeader);
  const nonLeaders = presetMembers.filter((pm) => !pm.isLeader);
  const sorted = [...leaders, ...nonLeaders];

  return (
    <TertiarySection minSize fill>
      <Scroll axis="both" ref={scrollRef} onScroll={onScroll}>
        <Row wrap centerOnWrap>
          {sorted.map((presetMember) => {
            const isSelected = selectedMemberId === presetMember.presetMemberId;

            return (
              <Button
                key={presetMember.presetMemberId}
                variantTone="ghost"
                onClick={
                  onClick ? (event) => onClick(presetMember, event) : undefined
                }
                isPressed={isSelected}
              >
                <PresetMemberCard presetMember={presetMember} />
              </Button>
            );
          })}
        </Row>
      </Scroll>
    </TertiarySection>
  );
}
