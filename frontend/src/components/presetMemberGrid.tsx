import {
  PresetMemberCard,
  type PresetMemberCardProps,
} from "./presetMemberCard";
import { Section } from "@/components/commons/section";
import { clsx } from "clsx";
import styles from "@/styles/components/memberGrid.module.css";

interface PresetMemberGridProps {
  presetMembers: PresetMemberCardProps["presetMember"][];
  selectedMemberId?: number | null;
  onMemberClick: (presetMemberId: number) => void;
  className?: string;
  connectedUsers?: number[];
  clientMemberId?: number;
}

export function PresetMemberGrid({
  presetMembers,
  selectedMemberId,
  onMemberClick,
  className,
  connectedUsers,
  clientMemberId,
}: PresetMemberGridProps) {
  const leaders = presetMembers.filter((pm) => pm.isLeader);
  const nonLeaders = presetMembers.filter((pm) => !pm.isLeader);
  const sorted = [...leaders, ...nonLeaders];

  return (
    <Section
      variantTone="ghost"
      variantLayout="grid"
      className={clsx(styles.grid, className)}
    >
      {sorted.map((presetMember) => (
        <div
          key={presetMember.presetMemberId}
          className={styles.gridItem}
          onClick={() => onMemberClick(presetMember.presetMemberId)}
        >
          <PresetMemberCard
            presetMember={presetMember}
            isActive={selectedMemberId === presetMember.presetMemberId}
            isConnected={
              connectedUsers
                ? connectedUsers.includes(presetMember.memberId)
                : undefined
            }
            isClientMember={
              clientMemberId
                ? clientMemberId === presetMember.memberId
                : undefined
            }
          />
        </div>
      ))}
    </Section>
  );
}
