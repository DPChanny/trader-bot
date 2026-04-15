import { clsx } from "clsx";
import styles from "@styles/components/memberCard.module.css";
import { Card, type CardProps } from "./atoms/card";
import { Image } from "./atoms/image";
import { Column, Fill } from "./atoms/layout";
import { Name } from "./atoms/text";
import { Badge } from "./molecules/badge";
import type { MemberDetailDTO } from "@dtos/member";
import { getRoleEntries } from "@utils/enum";

export type MemberCardProps = Omit<CardProps, "children"> & {
  member: MemberDetailDTO;
};

export function MemberCard({ member, className, ...props }: MemberCardProps) {
  const displayName = member.alias || member.name || member.user.name;
  const avatarUrl = member.avatarUrl || member.user.avatarUrl;
  const roleEntry = getRoleEntries()[member.role];
  const roleLabel = roleEntry.displayName.charAt(0);
  const roleColor = roleEntry.color;

  return (
    <Card
      variantColor="gray"
      className={clsx(styles.memberCard, className)}
      {...props}
    >
      {roleLabel && (
        <div className={styles.badgesRight}>
          <Badge variantColor={roleColor}>{roleLabel}</Badge>
        </div>
      )}
      <Fill direction="column" gap="sm" align="center" justify="center">
        <Image
          src={avatarUrl}
          alt={displayName}
          variantContent="avatar"
          variantSize="large"
        />
        <Name variantSize="small">{displayName}</Name>
      </Fill>
    </Card>
  );
}
