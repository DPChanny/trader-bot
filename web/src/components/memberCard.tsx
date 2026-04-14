import styles from "@/styles/components/memberCard.module.css";
import { Card } from "@/components/commons/card";
import { Column } from "@/components/commons/layout";
import { Badge } from "@/components/commons/badge";
import type { MemberDetailDTO } from "@/dtos/member";

const ROLE_LABEL: Record<number, string> = {
  3: "O",
  2: "A",
  1: "E",
  0: "V",
};

const ROLE_COLOR: Record<number, "gold" | "red" | "blue" | "gray"> = {
  3: "gold",
  2: "red",
  1: "blue",
  0: "gray",
};

export interface MemberCardProps {
  member: MemberDetailDTO;
  isActive?: boolean;
}

export function MemberCard({ member, isActive }: MemberCardProps) {
  const displayName = member.alias || member.name || member.user.name;
  const avatarUrl = member.avatarUrl || member.user.avatarUrl;
  const roleLabel = ROLE_LABEL[member.role];
  const roleColor = ROLE_COLOR[member.role];

  return (
    <Card
      variantColor="gray"
      variantActive={isActive}
      className={styles.memberCard}
    >
      {roleLabel && (
        <div className={styles.badgesRight}>
          <Badge
            variantColor={roleColor}
            variantSize="small"
            variantTone="outline"
          >
            {roleLabel}
          </Badge>
        </div>
      )}
      <Column gap="sm">
        <div class={styles.profile}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} />
          ) : (
            <svg
              class={styles.profileIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.5" />
              <path
                d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20V21H4V20Z"
                fill="currentColor"
                opacity="0.5"
              />
            </svg>
          )}
        </div>

        <Column gap="xs">
          <h3 class={styles.name}>{displayName}</h3>
        </Column>
      </Column>
    </Card>
  );
}
