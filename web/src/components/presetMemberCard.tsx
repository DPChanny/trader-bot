import { clsx } from "clsx";
import styles from "@/styles/components/memberCard.module.css";
import { Card, type CardProps } from "@/components/commons/card";
import { Badge } from "@/components/commons/badge";
import { Image } from "@/components/commons/image";
import { Column } from "@/components/commons/layout";
import type { PresetMemberDetailDTO } from "@/dtos/presetMember";

export type PresetMemberCardProps = Omit<CardProps, "children"> & {
  presetMember: PresetMemberDetailDTO;
  isConnected?: boolean;
  isClientMember?: boolean;
};

export function PresetMemberCard({
  presetMember,
  className,
  isConnected,
  isClientMember,
  ...props
}: PresetMemberCardProps) {
  const { member, tier, presetMemberPositions, isLeader } = presetMember;

  const statusClass = (() => {
    if (isClientMember) return styles.statusDotClient;
    if (isConnected === true) return styles.statusDotOnline;
    if (isConnected === false) return styles.statusDotOffline;
    return null;
  })();

  return (
    <Card
      variantColor={isLeader ? "gold" : "gray"}
      className={clsx(styles.memberCard, className)}
      {...props}
    >
      <div class={styles.badgesLeft}>
        {statusClass && <div className={clsx(styles.statusDot, statusClass)} />}
      </div>
      <div class={styles.badgesRight}>
        {tier && (
          <Badge
            src={tier.iconUrl || undefined}
            alt={tier.name}
            variantColor="red"
          >
            {tier.name.charAt(0)}
          </Badge>
        )}
      </div>

      <Column gap="sm" align="center">
        <Image
          src={member.avatarUrl || member.user.avatarUrl}
          alt={member.alias || member.name || member.user.name}
          variantSize="profile"
        />
        <Column gap="xs" align="center">
          <h3 class={styles.name}>
            {member.alias || member.name || member.user.name}
          </h3>
          {presetMemberPositions?.length > 0 && (
            <div className={styles.positions}>
              {presetMemberPositions.slice(0, 3).map((pmp) => (
                <Badge
                  key={pmp.positionId}
                  src={pmp.position.iconUrl || undefined}
                  alt={pmp.position.name}
                  variantSize="medium"
                  variantColor="blue"
                >
                  {pmp.position.name.charAt(0)}
                </Badge>
              ))}
            </div>
          )}
        </Column>
      </Column>
    </Card>
  );
}
