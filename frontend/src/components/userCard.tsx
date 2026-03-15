import { clsx } from "clsx";
import styles from "@/styles/components/userCard.module.css";
import { cva, type VariantProps } from "class-variance-authority";
import { Badge } from "./badge";
import { Section } from "./section";
import type { User } from "@/dtos";

const userCardVariants = cva("", {
  variants: {
    variant: {
      detail: styles.cardDetail,
      compact: styles.cardCompact,
    },
  },
  defaultVariants: {
    variant: "detail",
  },
});

export interface UserCardProps extends VariantProps<typeof userCardVariants> {
  user: User;
}

export function UserCard({ user, variant }: UserCardProps) {
  return (
    <Section className={clsx(styles.card, userCardVariants({ variant }))}>
      <div class={styles.card__badgesLeft}>
        {variant === "detail" && (
          <Badge variantColor="gray" variantSize="md">{`${user.userId}`}</Badge>
        )}
      </div>

      <Section variantTone="ghost" variantType="secondary">
        <div class={styles.card__profile}>
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
            class={styles.card__profileIcon}
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

        <Section variantTone="ghost" variantType="tertiary">
          <h3 class={styles.card__name}>{user.name}</h3>
          {variant === "detail" && user.riotId && (
            <div class={styles.card__riotId}>{user.riotId}</div>
          )}
        </Section>
      </Section>
    </Section>
  );
}
