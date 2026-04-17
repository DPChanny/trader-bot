import { PresetMemberCard } from "./presetMemberCard";
import { PressedButton } from "./atoms/button";
import { Row, Scroll } from "./atoms/layout";
import styles from "@styles/components/memberGrid.module.css";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import { TertiarySection } from "./molecules/section";

interface PresetMemberGridProps {
  presetMembers: PresetMemberDetailDTO[];
  selectedMemberId?: number | null;
  onClick?: (presetMemberId: number) => void;
}

export function PresetMemberGrid({
  presetMembers,
  selectedMemberId,
  onClick,
}: PresetMemberGridProps) {
  const leaders = presetMembers.filter((pm) => pm.isLeader);
  const nonLeaders = presetMembers.filter((pm) => !pm.isLeader);
  const sorted = [...leaders, ...nonLeaders];

  return (
    <TertiarySection minSize>
      <Scroll axis="both" fill>
        <Row wrap center>
          {sorted.map((presetMember) => {
            const isSelected = selectedMemberId === presetMember.presetMemberId;

            return (
              <PressedButton
                key={presetMember.presetMemberId}
                className={styles.gridButton}
                onClick={
                  onClick
                    ? () => onClick(presetMember.presetMemberId)
                    : undefined
                }
                isPressed={isSelected}
                disabled={!onClick}
              >
                <PresetMemberCard presetMember={presetMember} />
              </PressedButton>
            );
          })}
        </Row>
      </Scroll>
    </TertiarySection>
  );
}
