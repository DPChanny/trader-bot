import { UserCard } from "./userCard";
import { Section } from "./section";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/userGrid.module.css";
import type { User } from "@/dto";

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

interface UserGridProps {
  users: User[];
  selectedUserId?: number | string | null;
  onUserClick: (userId: number | string) => void;
  variantVariant?: "detail" | "compact";
  className?: string;
}

export function UserGrid({
  users,
  selectedUserId,
  onUserClick,
  variantVariant = "compact",
  className,
}: UserGridProps) {
  return (
    <Section
      variantTone="ghost"
      variantLayout="grid"
      className={clsx(gridVariants({ variantVariant }), className)}
    >
      {users.map((user) => (
        <div
          key={user.userId}
          className={gridItemVariants({
            variantSelected: selectedUserId === user.userId,
          })}
          onClick={() => onUserClick(user.userId)}
        >
          <UserCard user={user} variantVariant={variantVariant} />
        </div>
      ))}
    </Section>
  );
}
