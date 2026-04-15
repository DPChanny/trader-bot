import { PresetMemberCard } from "./presetMemberCard";
import { PressedButton } from "./atoms/button";
import { Row, Scroll } from "./atoms/layout";
import styles from "@styles/components/memberGrid.module.css";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import { TertiarySection } from "./molecules/section";

interface PresetMemberGridProps {
  presetMembers: PresetMemberDetailDTO[];
  selectedMemberId?: number | null;
  onMemberClick: (presetMemberId: number) => void;
  className?: string;
  connectedMemberIds?: number[];
  clientMemberId?: number;
}

export function PresetMemberGrid({
  presetMembers,
  selectedMemberId,
  onMemberClick,
  className,
  connectedMemberIds,
  clientMemberId,
}: PresetMemberGridProps) {
  const leaders = presetMembers.filter((pm) => pm.isLeader);
  const nonLeaders = presetMembers.filter((pm) => !pm.isLeader);
  const sorted = [...leaders, ...nonLeaders];

  return (
    <TertiarySection fill>
      <Scroll axis="both">
        <Row wrap gap="md" align="start" className={className}>
          {sorted.map((presetMember) => {
            const isSelected = selectedMemberId === presetMember.presetMemberId;

            return (
              <PressedButton
                key={presetMember.presetMemberId}
                type="button"
                className={styles.gridButton}
                onClick={() => onMemberClick(presetMember.presetMemberId)}
                isPressed={isSelected}
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
