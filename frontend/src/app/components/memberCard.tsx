import styles from "@styles/components/memberCard.module.css";
import { Card } from "./molecules/card";
import { Image } from "./atoms/image";
import { Name } from "./atoms/text";
import { Badge } from "./atoms/badge";
import type { MemberDetailDTO } from "@dtos/member";
import { getRoleEntries } from "@utils/enum";

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
    <Card
      variantColor="gray"
      justify="center"
      align="center"
      className={styles.memberCard}
    >
      {roleLabel && (
        <div className={styles.badgesRight}>
          <Badge variantColor={roleColor}>{roleLabel}</Badge>
        </div>
      )}

      <Image
        src={avatarUrl}
        alt={displayName}
        variantContent="avatar"
        variantSize="large"
      />
      <Name variantSize="small">{displayName}</Name>
    </Card>
  );
}
