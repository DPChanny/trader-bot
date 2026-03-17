import { UserCard } from "./userCard";
import { Section } from "./section";
import { clsx } from "clsx";
import styles from "@/styles/components/userGrid.module.css";
import type { User } from "@/dto";

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
          className={styles.gridItem}
          onClick={() => onUserClick(user.userId)}
        >
          <UserCard
            user={user}
            variantActive={selectedUserId === user.userId}
          />
        </div>
      ))}
    </Section>
  );
}
