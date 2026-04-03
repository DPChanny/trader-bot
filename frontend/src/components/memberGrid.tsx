import { MemberCard } from "./memberCard";
import { Section } from "./commons/section";
import { clsx } from "clsx";
import styles from "@/styles/components/memberGrid.module.css";
import type { MemberDTO } from "@/dtos/memberDto";

interface MemberGridProps {
  members: MemberDTO[];
  selectedMemberId?: number | null;
  onMemberClick: (memberId: number) => void;
  className?: string;
}

export function MemberGrid({
  members,
  selectedMemberId,
  onMemberClick,
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
          onClick={() => onMemberClick(member.memberId)}
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
