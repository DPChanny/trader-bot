import { PresetMemberCard } from "./presetMemberCard";
import { PressedButton } from "./atoms/button";
import { Row, Scroll } from "./atoms/layout";
import type { PresetMemberDetailDTO } from "@features/presetMember/dto";
import { TertiarySection } from "./surfaces/section";
import type { RefObject } from "react";

interface PresetMemberGridProps {
  presetMembers: PresetMemberDetailDTO[];
  selectedMemberId?: number | null;
  onClick?: (
    presetMember: PresetMemberDetailDTO,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => void;
  sentinelRef?: RefObject<HTMLDivElement | null>;
}

export function PresetMemberGrid({
  presetMembers,
  selectedMemberId,
  onClick,
  sentinelRef,
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
        <div ref={sentinelRef} />
      </Scroll>
    </TertiarySection>
  );
}
