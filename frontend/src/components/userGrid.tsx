import { UserCard } from "./userCard";
import { Section } from "./section";
import { clsx } from "clsx";
import styles from "@/styles/components/userGrid.module.css";
import type { Member } from "@/dto";

interface UserGridProps {
  members: Member[];
  selectedMemberId?: number | null;
  onMemberClick: (memberId: number) => void;
  className?: string;
}

export function UserGrid({
  members,
  selectedMemberId,
  onMemberClick,
  className,
}: UserGridProps) {
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
          <UserCard
            member={member}
            isActive={selectedMemberId === member.memberId}
          />
        </div>
      ))}
    </Section>
  );
}
