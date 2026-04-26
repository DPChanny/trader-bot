import styles from "@styles/components/memberCard.module.css";
import { Card } from "./surfaces/card";
import { Image } from "./atoms/image";
import { Name } from "./atoms/text";
import { Badge } from "./atoms/badge";
import type { MemberDetailDTO } from "@features/member/dto";
import { getRoleEntries } from "@features/member/dto";

export type MemberCardProps = {
  member: MemberDetailDTO;
};

export function MemberCard({ member }: MemberCardProps) {
  const displayName = member.alias || member.name || member.user.name;
  const avatarUrl = member.avatarUrl || member.user.avatarUrl;
  const roleEntry = getRoleEntries()[member.role];
  const roleLabel = roleEntry.displayName.charAt(0);
  const roleColor = roleEntry.color;

  return (
    <Card variantColor="gray" center className={styles.memberCard} gap="xs">
      {roleLabel && (
        <div className={styles.topRight}>
          <Badge variantColor={roleColor}>{roleLabel}</Badge>
        </div>
      )}

      <Image
        src={avatarUrl}
        alt={displayName}
        variantContent="avatar"
        variantSize="large"
      />
      <Name className={styles.name} variantSize="small">
        {displayName}
      </Name>
    </Card>
  );
}
