import styles from "@styles/components/memberCard.module.css";
import { Card } from "./surfaces/card";
import { Dot, type DotProps } from "./molecules/dot";
import { Badge } from "./atoms/badge";
import { Image } from "./atoms/image";
import { Row } from "./atoms/layout";
import { Name } from "./atoms/text";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import { useContext } from "preact/hooks";
import { AuctionPageContext } from "@pages/auctionPage/auctionPageContext";

function getDotColor(
  isConnected?: boolean,
  isClientMember?: boolean,
): DotProps["variantColor"] {
  if (isClientMember) return "blue";
  if (isConnected === true) return "green";
  if (isConnected === false) return "red";
  return undefined;
}

export type PresetMemberCardProps = {
  presetMember: PresetMemberDetailDTO;
};

export function PresetMemberCard({ presetMember }: PresetMemberCardProps) {
  const context = useContext(AuctionPageContext);
  const isConnected = context
    ? context.connectedMemberIds.includes(presetMember.memberId)
    : undefined;
  const isClientMember =
    context?.clientMemberId !== undefined
      ? context.clientMemberId === presetMember.memberId
      : undefined;

  const { member, tier, presetMemberPositions, isLeader } = presetMember;
  const visiblePositions = presetMemberPositions?.slice(0, 3) ?? [];
  const variantColor = getDotColor(isConnected, isClientMember);

  return (
    <Card
      center
      variantColor={isLeader ? "gold" : "gray"}
      className={styles.memberCard}
      gap="xs"
    >
      <div className={styles.topLeft}>
        {variantColor && <Dot variantColor={variantColor} />}
      </div>
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
