import { MemberCard } from "./memberCard";
import { PressedButton } from "@/components/atoms/button";
import { Row, Scroll } from "@/components/atoms/layout";
import styles from "@/styles/components/memberGrid.module.css";
import type { MemberDetailDTO } from "@/dtos/member";

interface MemberGridProps {
  members: MemberDetailDTO[];
  onMemberClick?: (memberId: number) => void;
  selectedMemberId?: number | null;
  className?: string;
}

export function MemberGrid({
  members,
  onMemberClick,
  selectedMemberId,
  className,
}: MemberGridProps) {
  return (
    <Scroll axis="both">
      <Row wrap gap="md" align="start" className={className}>
        {members.map((member) => {
          const isSelected = selectedMemberId === member.memberId;

          return (
            <PressedButton
              key={member.memberId}
              type="button"
              className={styles.gridButton}
              onClick={
                onMemberClick ? () => onMemberClick(member.memberId) : undefined
              }
              isPressed={isSelected}
              disabled={!onMemberClick}
            >
              <MemberCard member={member} />
            </PressedButton>
          );
        })}
      </Row>
    </Scroll>
  );
}
