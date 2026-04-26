import styles from "@styles/components/memberCard.module.css";
import { Card } from "./surfaces/card";
import { Badge } from "./atoms/badge";
import { Image } from "./atoms/image";
import { Row } from "./atoms/layout";
import { Name } from "./atoms/text";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";

export type PresetMemberCardProps = {
  presetMember: PresetMemberDetailDTO;
};

export function PresetMemberCard({ presetMember }: PresetMemberCardProps) {
  const { member, tier, presetMemberPositions, isLeader } = presetMember;
  const visiblePositions = presetMemberPositions?.slice(0, 3) ?? [];

  return (
    <Card
      center
      variantColor={isLeader ? "gold" : "gray"}
      className={styles.memberCard}
      gap="xs"
    >
      <div className={styles.topRight}>
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
      <Name className={styles.name} variantSize="small">
        {member.alias || member.name || member.user.name}
      </Name>
      <Row center className={styles.positions}>
        {visiblePositions.map((pmp) => (
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
    </Card>
  );
}
