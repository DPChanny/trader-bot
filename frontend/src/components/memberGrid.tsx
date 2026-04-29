import { MemberCard } from "./memberCard";
import { PressedButton } from "./atoms/button";
import { Row, Scroll } from "./atoms/layout";
import type { MemberDetailDTO } from "@features/member/dto";
import { TertiarySection } from "./surfaces/section";
import type { RefObject } from "react";

interface MemberGridProps {
  members: MemberDetailDTO[];
  onClick?: (memberId: number) => void;
  selectedMemberId?: number | null;
  sentinelRef?: RefObject<HTMLDivElement | null>;
}

export function MemberGrid({
  members,
  onClick,
  selectedMemberId,
  sentinelRef,
}: MemberGridProps) {
  return (
    <TertiarySection minSize fill>
      <Scroll axis="both">
        <Row wrap centerOnWrap>
          {members.map((member) => {
            const isSelected = selectedMemberId === member.memberId;
            return (
              <PressedButton
                key={member.memberId}
                onClick={onClick ? () => onClick(member.memberId) : undefined}
                isPressed={isSelected}
                disabled={!onClick}
              >
                <MemberCard member={member} />
              </PressedButton>
            );
          })}
        </Row>
        <div ref={sentinelRef} />
      </Scroll>
    </TertiarySection>
  );
}
