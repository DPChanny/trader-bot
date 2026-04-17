import { MemberCard } from "./memberCard";
import { PressedButton } from "./atoms/button";
import { Row, Scroll } from "./atoms/layout";
import styles from "@styles/components/memberGrid.module.css";
import type { MemberDetailDTO } from "@dtos/member";
import { TertiarySection } from "./molecules/section";

interface MemberGridProps {
  members: MemberDetailDTO[];
  onClick?: (memberId: number) => void;
  selectedMemberId?: number | null;
}

export function MemberGrid({
  members,
  onClick,
  selectedMemberId,
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
                className={styles.gridButton}
                onClick={onClick ? () => onClick(member.memberId) : undefined}
                isPressed={isSelected}
                disabled={!onClick}
              >
                <MemberCard member={member} />
              </PressedButton>
            );
          })}
        </Row>
      </Scroll>
    </TertiarySection>
  );
}
