import { UserCard } from "./userCard";
import { Section } from "./section";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import styles from "@/styles/components/userGrid.module.css";
import type { User } from "@/dto";

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
  selectedUserId?: number | null;
  onUserClick: (userId: number) => void;
  className?: string;
}

export function UserGrid({
  users,
  selectedUserId,
  onUserClick,
  className,
}: UserGridProps) {
  return (
    <Section
      variantTone="ghost"
      variantLayout="grid"
      className={clsx(styles.grid, className)}
    >
      {users.map((user) => (
        <div
          key={user.userId}
          className={gridItemVariants({
            variantSelected: selectedUserId === user.userId,
          })}
          onClick={() => onUserClick(user.userId)}
        >
          <UserCard user={user} />
        </div>
      ))}
    </Section>
  );
}
