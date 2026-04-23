
import { PresetMemberCard } from "./presetMemberCard";
import { PressedButton } from "./atoms/button";
import { Row, Scroll } from "./atoms/layout";
import styles from "@styles/components/memberGrid.module.css";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";
import { TertiarySection } from "./surfaces/section";

interface PresetMemberGridProps {
  presetMembers: PresetMemberDetailDTO[];
  selectedMemberId?: number | null;
  onClick?: (
    presetMember: PresetMemberDetailDTO,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
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
    <TertiarySection minSize fill>
      <Scroll axis="both">
        <Row wrap centerOnWrap>
          {sorted.map((presetMember) => {
            const isSelected = selectedMemberId === presetMember.presetMemberId;

            return (
              <PressedButton
                key={presetMember.presetMemberId}
                className={styles.gridButton}
                onClick={
                  onClick ? (event) => onClick(presetMember, event) : undefined
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

