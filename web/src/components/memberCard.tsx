import { clsx } from "clsx";
import styles from "@/styles/components/memberCard.module.css";
import { Card, type CardProps } from "@/components/commons/card";
import { Image } from "@/components/commons/image";
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

export type MemberCardProps = Omit<CardProps, "children"> & {
  member: MemberDetailDTO;
};

export function MemberCard({ member, className, ...props }: MemberCardProps) {
  const displayName = member.alias || member.name || member.user.name;
  const avatarUrl = member.avatarUrl || member.user.avatarUrl;
  const roleLabel = ROLE_LABEL[member.role];
  const roleColor = ROLE_COLOR[member.role];

  return (
    <Card
      variantColor="gray"
      className={clsx(styles.memberCard, className)}
      {...props}
    >
      {roleLabel && (
        <div className={styles.badgesRight}>
          <Badge variantColor={roleColor} variantSize="small">
            {roleLabel}
          </Badge>
        </div>
      )}
      <Column gap="sm" align="center">
        <Image src={avatarUrl} alt={displayName} variantSize="large" />
        <Column gap="xs" align="center">
          <h3 class={styles.name}>{displayName}</h3>
        </Column>
      </Column>
    </Card>
  );
}
