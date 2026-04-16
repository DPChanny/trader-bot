import { PresetMemberCard } from "./presetMemberCard";
import { PressedButton } from "./atoms/button";
import { Row, Scroll } from "./atoms/layout";
import styles from "@styles/components/memberGrid.module.css";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import { TertiarySection } from "./molecules/section";

interface PresetMemberGridProps {
  presetMembers: PresetMemberDetailDTO[];
  selectedMemberId?: number | null;
  onMemberClick?: (presetMemberId: number) => void;
  connectedMemberIds?: number[];
  clientMemberId?: number;
}

export function PresetMemberGrid({
  presetMembers,
  selectedMemberId,
  onMemberClick,
  connectedMemberIds,
  clientMemberId,
}: PresetMemberGridProps) {
  const leaders = presetMembers.filter((pm) => pm.isLeader);
  const nonLeaders = presetMembers.filter((pm) => !pm.isLeader);
  const sorted = [...leaders, ...nonLeaders];

  return (
    <TertiarySection fill>
      <Scroll axis="both">
        <Row wrap>
          {sorted.map((presetMember) => {
            const isSelected = selectedMemberId === presetMember.presetMemberId;

            return (
              <PressedButton
                key={presetMember.presetMemberId}
                className={styles.gridButton}
                onClick={
                  onMemberClick
                    ? () => onMemberClick(presetMember.presetMemberId)
                    : undefined
                }
                isPressed={isSelected}
                disabled={!onMemberClick}
              >
                <PresetMemberCard
                  presetMember={presetMember}
                  isConnected={
                    connectedMemberIds
                      ? connectedMemberIds.includes(presetMember.memberId)
                      : undefined
                  }
                  isClientMember={
                    clientMemberId
                      ? clientMemberId === presetMember.memberId
                      : undefined
                  }
                />
              </PressedButton>
            );
          })}
        </Row>
      </Scroll>
    </TertiarySection>
  );
}
