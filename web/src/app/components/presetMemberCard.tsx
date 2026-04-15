import { clsx } from "clsx";
import styles from "@styles/components/memberCard.module.css";
import { Card, type CardProps } from "./molecules/card";
import { Badge } from "./atoms/badge";
import { Image } from "./atoms/image";
import { Row } from "./atoms/layout";
import { Name } from "./atoms/text";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";

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
      justify="center"
      align="center"
      variantColor={isLeader ? "gold" : "gray"}
      className={clsx(styles.memberCard, className)}
      {...props}
    >
      <div class={styles.badgesLeft}>
        {statusClass && <div className={clsx(styles.statusDot, statusClass)} />}
      </div>
      <div class={styles.badgesRight}>
        {tier && (
          <Badge variantColor="red">
            {tier.iconUrl ? (
              <Image src={tier.iconUrl} alt={tier.name} variantSize="auto" />
            ) : (
              tier.name.charAt(0)
            )}
          </Badge>
        )}
      </div>

      <Image
        src={member.avatarUrl || member.user.avatarUrl}
        alt={member.alias || member.name || member.user.name}
        variantContent="avatar"
        variantSize="large"
      />
      <Name variantSize="small">
        {member.alias || member.name || member.user.name}
      </Name>
      {presetMemberPositions?.length > 0 && (
        <Row wrap align="center" justify="center" gap="xs">
          {presetMemberPositions.slice(0, 3).map((pmp) => (
            <Badge key={pmp.positionId} variantColor="blue">
              {pmp.position.iconUrl ? (
                <Image
                  src={pmp.position.iconUrl}
                  alt={pmp.position.name}
                  variantSize="auto"
                />
              ) : (
                pmp.position.name.charAt(0)
              )}
            </Badge>
          ))}
        </Row>
      )}
    </Card>
  );
}
