import { PresetUserCard, type PresetUserCardProps } from "./presetUserCard";
import { Section } from "./section";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/userGrid.module.css";

const gridVariants = cva(styles.grid, {
  variants: {
    variantVariant: {
      detail: styles.variantDetail,
      compact: styles.variantCompact,
    },
  },
  defaultVariants: {
    variantVariant: "compact",
  },
});

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
  selectedUserId?: number | string | null;
  onUserClick: (userId: number | string) => void;
  variantVariant?: "detail" | "compact";
  className?: string;
  connectedUsers?: number[] | null;
  clientUserId?: number | null;
}

export function PresetUserGrid({
  presetUsers,
  selectedUserId,
  onUserClick,
  variantVariant = "compact",
  className,
  connectedUsers = null,
  clientUserId = null,
}: PresetUserGridProps) {
  const leaders = presetUsers.filter((pu) => pu.isLeader);
  const nonLeaders = presetUsers.filter((pu) => !pu.isLeader);
  const sortedUsers = [...leaders, ...nonLeaders];

  return (
    <Section
      variantTone="ghost"
      variantLayout="grid"
      className={clsx(gridVariants({ variantVariant }), className)}
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
            variantVariant={variantVariant}
            isConnected={
              connectedUsers ? connectedUsers.includes(presetUser.userId) : null
            }
            isClientUser={
              clientUserId ? clientUserId === presetUser.userId : null
            }
          />
        </div>
      ))}
    </Section>
  );
}
