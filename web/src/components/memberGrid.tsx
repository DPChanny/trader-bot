import { MemberCard } from "./memberCard";
import { PressedButton } from "@/components/commons/button";
import { Grid } from "@/components/commons/layout";
import { clsx } from "clsx";
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
    <Grid gap="md" className={clsx(styles.grid, className)}>
      {members.map((member) => {
        const isActive = selectedMemberId === member.memberId;

        return (
          <PressedButton
            key={member.memberId}
            type="button"
            className={clsx(styles.gridItem, styles.gridButton)}
            onClick={
              onMemberClick ? () => onMemberClick(member.memberId) : undefined
            }
            isPressed={isActive}
            disabled={!onMemberClick}
          >
            <MemberCard member={member} isActive={isActive} />
          </PressedButton>
        );
      })}
    </Grid>
  );
}
