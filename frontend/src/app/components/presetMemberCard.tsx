import styles from "@styles/components/memberCard.module.css";
import { Card } from "./molecules/card";
import { Badge } from "./atoms/badge";
import { Image } from "./atoms/image";
import { Column, Row } from "./atoms/layout";
import { Name } from "./atoms/text";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";

export type PresetMemberCardProps = {
  presetMember: PresetMemberDetailDTO;
  isConnected?: boolean;
  isClientMember?: boolean;
};

export function PresetMemberCard({
  presetMember,
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
      justify="center"
      align="center"
      variantColor={isLeader ? "gold" : "gray"}
      className={styles.memberCard}
    >
      <div class={styles.topLeft}>
        {statusClass && (
          <div className={`${styles.statusDot} ${statusClass}`} />
        )}
      </div>
      <div class={styles.topRight}>
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

      <Column gap="xs" center>
        <Image
          src={member.avatarUrl || member.user.avatarUrl}
          alt={member.alias || member.name || member.user.name}
          variantContent="avatar"
          variantSize="large"
        />
        <Name variantSize="small">
          {member.alias || member.name || member.user.name}
        </Name>
      </Column>
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
