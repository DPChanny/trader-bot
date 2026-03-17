import styles from "@/styles/components/userCard.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import { Section } from "./section";
import type { User } from "@/dto";

const userCardVariants = cva([styles.card, styles.colorBlue], {
  variants: {
    variantActive: {
      true: styles.activeTrue,
      false: "",
    },
  },
  defaultVariants: {
    variantActive: false,
  },
});

export interface UserCardProps extends VariantProps<typeof userCardVariants> {
  user: User;
  isActive?: boolean;
}

export function UserCard({ user, isActive }: UserCardProps) {
  return (
    <Section className={userCardVariants({ variantActive: isActive })}>
      <Section variantTone="ghost" variantIntent="secondary">
        <div class={styles.profile}>
          <img
            src={user.discordProfileUrl}
            alt={user.name}
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const svg = e.currentTarget.nextElementSibling as HTMLElement;
              if (svg) svg.style.display = "block";
            }}
          />
          <svg
            class={styles.profileIcon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "none" }}
          >
            <circle cx="12" cy="8" r="4" fill="currentColor" opacity="0.5" />
            <path
              d="M4 20C4 16.6863 6.68629 14 10 14H14C17.3137 14 20 16.6863 20 20V21H4V20Z"
              fill="currentColor"
              opacity="0.5"
            />
          </svg>
        </div>

        <Section variantTone="ghost" variantIntent="tertiary">
          <h3 class={styles.name}>{user.name}</h3>
        </Section>
      </Section>
    </Section>
  );
}
