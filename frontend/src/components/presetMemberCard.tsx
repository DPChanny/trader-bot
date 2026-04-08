import { clsx } from "clsx";
import styles from "@/styles/components/memberCard.module.css";
import { Card } from "@/components/commons/card";
import { Badge } from "@/components/commons/badge";
import { Section } from "@/components/commons/section";
import type { PresetMemberDetailDTO } from "@/dtos/presetMemberDto";
import type { TierDTO } from "@/dtos/tierDto";
import type { PositionDTO } from "@/dtos/positionDto";

export interface PresetMemberCardProps {
  presetMember: PresetMemberDetailDTO;
  tiers: TierDTO[];
  positions: PositionDTO[];
  isActive?: boolean;
  isConnected?: boolean;
  isClientMember?: boolean;
}

export function PresetMemberCard({
  presetMember,
  tiers,
  positions,
  isActive,
  isConnected,
  isClientMember,
}: PresetMemberCardProps) {
  const { member, presetMemberPositions, isLeader } = presetMember;
  const tier = tiers.find((t) => t.tierId === presetMember.tierId) ?? null;
  const resolvedPositions = presetMemberPositions.map(
    (pmp) => positions.find((p) => p.positionId === pmp.positionId)!,
  );

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
        {tier && <Badge variantColor="red">{tier.name.charAt(0)}</Badge>}
      </div>

      <Section variantTone="ghost" variantIntent="secondary">
        <div class={styles.profile}>
          {member?.discord?.avatarUrl ? (
            <img
              src={member.discord.avatarUrl}
              alt={member?.discord?.name || member?.riotId || "이름 없음"}
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

        <Section variantTone="ghost" variantIntent="tertiary">
          <h3 class={styles.name}>
            {member?.discord?.name || member?.riotId || "이름 없음"}
          </h3>
          {presetMemberPositions?.length > 0 && (
            <Section
              variantTone="ghost"
              variantLayout="row"
              variantIntent="tertiary"
              className={styles.positions}
            >
              {resolvedPositions.slice(0, 3).map((p) => (
                <Badge
                  key={p.positionId}
                  src={p.iconUrl || undefined}
                  alt={p.name}
                  variantSize="medium"
                  variantColor="blue"
                >
                  {p.name.charAt(0)}
                </Badge>
              ))}
            </Section>
          )}
        </Section>
      </Section>
    </Card>
  );
}
