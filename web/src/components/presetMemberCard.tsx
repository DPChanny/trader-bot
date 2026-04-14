import { clsx } from "clsx";
import styles from "@/styles/components/memberCard.module.css";
import { Card } from "@/components/commons/card";
import { Badge } from "@/components/commons/badge";
import { Column } from "@/components/commons/layout";
import type { PresetMemberDetailDTO } from "@/dtos/presetMember";

export interface PresetMemberCardProps {
  presetMember: PresetMemberDetailDTO;
  isActive?: boolean;
  isConnected?: boolean;
  isClientMember?: boolean;
}

export function PresetMemberCard({
  presetMember,
  isActive,
  isConnected,
  isClientMember,
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
      variantActive={isActive}
      className={styles.memberCard}
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

      <Column gap="sm">
        <div class={styles.profile}>
          {member.avatarUrl || member.user.avatarUrl ? (
            <img
              src={(member.avatarUrl || member.user.avatarUrl)!}
              alt={member.alias || member.name || member.user.name}
            />
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
