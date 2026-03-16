import { PresetUserCard, type PresetUserCardProps } from "./presetUserCard";
import { Section } from "./section";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/userGrid.module.css";

const gridItemVariants = cva(styles.gridItem, {
  variants: {
    variantSelected: {
      true: styles.gridItemSelected,
      false: "",
    },
  },
  defaultVariants: {
    variantSelected: false,
  },
});

interface PresetUserGridProps {
  presetUsers: PresetUserCardProps["presetUser"][];
  selectedUserId?: number | null;
  onUserClick: (userId: number) => void;
  className?: string;
  connectedUsers?: number[];
  clientUserId?: number;
}

export function PresetUserGrid({
  presetUsers,
  selectedUserId,
  onUserClick,
  className,
  connectedUsers,
  clientUserId,
}: PresetUserGridProps) {
  const leaders = presetUsers.filter((pu) => pu.isLeader);
  const nonLeaders = presetUsers.filter((pu) => !pu.isLeader);
  const sortedUsers = [...leaders, ...nonLeaders];

  return (
    <Section
      variantTone="ghost"
      variantLayout="grid"
      className={clsx(styles.grid, className)}
    >
      {sortedUsers.map((presetUser) => (
        <div
          key={presetUser.presetUserId}
          className={gridItemVariants({
            variantSelected: selectedUserId === presetUser.presetUserId,
          })}
          onClick={() => onUserClick(presetUser.presetUserId)}
        >
          <PresetUserCard
            presetUser={presetUser}
            isConnected={
              connectedUsers
                ? connectedUsers.includes(presetUser.userId)
                : undefined
            }
            isClientUser={
              clientUserId ? clientUserId === presetUser.userId : undefined
            }
          />
        </div>
      ))}
    </Section>
  );
}
