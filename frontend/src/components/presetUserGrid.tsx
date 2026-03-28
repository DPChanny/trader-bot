import { PresetUserCard, type PresetUserCardProps } from "./presetUserCard";
import { Section } from "./section";
import { clsx } from "clsx";
import styles from "@/styles/components/userGrid.module.css";

interface PresetUserGridProps {
  presetMembers: PresetUserCardProps["presetMember"][];
  selectedMemberId?: number | null;
  onMemberClick: (presetMemberId: number) => void;
  className?: string;
  connectedUsers?: number[];
  clientMemberId?: number;
}

export function PresetUserGrid({
  presetMembers,
  selectedMemberId,
  onMemberClick,
  className,
  connectedUsers,
  clientMemberId,
}: PresetUserGridProps) {
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
          <PresetUserCard
            presetMember={presetMember}
            isActive={selectedMemberId === presetMember.presetMemberId}
            isConnected={
              connectedUsers
                ? connectedUsers.includes(presetMember.memberId)
                : undefined
            }
            isClientUser={
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
