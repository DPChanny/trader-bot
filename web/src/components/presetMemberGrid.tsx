import { PresetMemberCard } from "./presetMemberCard";
import { Grid } from "@/components/commons/layout";
import { clsx } from "clsx";
import styles from "@/styles/components/memberGrid.module.css";
import type { PresetMemberDetailDTO } from "@/dtos/presetMember";

interface PresetMemberGridProps {
  presetMembers: PresetMemberDetailDTO[];
  selectedMemberId?: number | null;
  onMemberClick: (presetMemberId: number) => void;
  className?: string;
  connectedMemberIds?: number[];
  clientMemberId?: number;
}

export function PresetMemberGrid({
  presetMembers,
  selectedMemberId,
  onMemberClick,
  className,
  connectedMemberIds,
  clientMemberId,
}: PresetMemberGridProps) {
  const leaders = presetMembers.filter((pm) => pm.isLeader);
  const nonLeaders = presetMembers.filter((pm) => !pm.isLeader);
  const sorted = [...leaders, ...nonLeaders];

  return (
    <Grid gap="md" className={clsx(styles.grid, className)}>
      {sorted.map((presetMember) => (
        <div
          key={presetMember.presetMemberId}
          className={styles.gridItem}
          onClick={() => onMemberClick(presetMember.presetMemberId)}
        >
          <PresetMemberCard
            presetMember={presetMember}
            isActive={selectedMemberId === presetMember.presetMemberId}
            isInteractive={true}
            isConnected={
              connectedMemberIds
                ? connectedMemberIds.includes(presetMember.memberId)
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
    </Grid>
  );
}
