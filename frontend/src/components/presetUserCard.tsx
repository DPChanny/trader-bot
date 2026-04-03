import { clsx } from "clsx";
import styles from "@/styles/components/userCard.module.css";
import { Card } from "./commons/card";
import { Badge } from "./commons/badge";
import { Section } from "./commons/section";
import type { PresetMemberDetailDTO } from "@/dtos/presetMemberDto";

export interface PresetUserCardProps {
  presetMember: PresetMemberDetailDTO;
  isActive?: boolean;
  isConnected?: boolean;
  isClientUser?: boolean;
}

export function PresetUserCard({
  presetMember,
  isActive,
  isConnected,
  isClientUser,
}: PresetUserCardProps) {
  const { member, tier, presetMemberPositions, isLeader } = presetMember;

  const statusClass = (() => {
    if (isClientUser) return styles.statusDotClient;
    if (isConnected === true) return styles.statusDotOnline;
    if (isConnected === false) return styles.statusDotOffline;
    return null;
  })();

  return (
    <Card
      variantColor={isLeader ? "gold" : "gray"}
      variantActive={isActive}
      className={styles.userCard}
    >
      <div class={styles.badgesLeft}>
        {statusClass && <div className={clsx(styles.statusDot, statusClass)} />}
      </div>
      <div class={styles.badgesRight}>
        {tier && <Badge variantColor="red">{tier.name.charAt(0)}</Badge>}
      </div>

      <Section variantTone="ghost" variantIntent="secondary">
        <div class={styles.profile}>
          {member?.profileUrl ? (
            <img src={member.profileUrl} alt={member?.alias || "이름 없음"} />
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
          <h3 class={styles.name}>{member?.alias || "이름 없음"}</h3>
          {presetMemberPositions?.length > 0 && (
            <Section
              variantTone="ghost"
              variantLayout="row"
              variantIntent="tertiary"
              className={styles.positions}
            >
              {presetMemberPositions!.slice(0, 3).map((p) => (
                <Badge
                  key={p.position.positionId}
                  src={p.position.iconUrl || undefined}
                  alt={p.position.name}
                  variantSize="medium"
                  variantColor="blue"
                >
                  {p.position.name.charAt(0)}
                </Badge>
              ))}
            </Section>
          )}
        </Section>
      </Section>
    </Card>
  );
}
