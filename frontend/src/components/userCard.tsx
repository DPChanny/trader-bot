import styles from "@/styles/components/userCard.module.css";
import { Card } from "./card";
import { Section } from "./section";
import type { Member } from "@/dto";

export interface UserCardProps {
  member: Member;
  isActive?: boolean;
}

export function UserCard({ member, isActive }: UserCardProps) {
  return (
    <Card
      variantColor="gray"
      variantActive={isActive}
      className={styles.userCard}
    >
      <Section variantTone="ghost" variantIntent="secondary">
        <div class={styles.profile}>
          {member.profileUrl ? (
            <img src={member.profileUrl} alt={member.alias || "이름 없음"} />
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

        <Section variantTone="ghost" variantIntent="tertiary">
          <h3 class={styles.name}>{member.alias || "이름 없음"}</h3>
        </Section>
      </Section>
    </Card>
  );
}
