import { MemberCard } from "./memberCard";
import { Section } from "@/components/commons/section";
import { clsx } from "clsx";
import styles from "@/styles/components/memberGrid.module.css";
import type { MemberDetailDTO } from "@/dtos/memberDto";

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
    <Section
      variantTone="ghost"
      variantLayout="grid"
      className={clsx(styles.grid, className)}
    >
      {members.map((member) => (
        <div
          key={member.memberId}
          className={styles.gridItem}
          onClick={() => onMemberClick?.(member.memberId)}
        >
          <MemberCard
            member={member}
            isActive={selectedMemberId === member.memberId}
          />
        </div>
      ))}
    </Section>
  );
}
