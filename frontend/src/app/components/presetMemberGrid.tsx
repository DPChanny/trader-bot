import { PresetMemberCard } from "./presetMemberCard";
import { PressedButton } from "./atoms/button";
import { Row, Scroll } from "./atoms/layout";
import styles from "@styles/components/memberGrid.module.css";
import type { PresetMemberDetailDTO } from "@dtos/presetMember";
import { TertiarySection } from "./molecules/section";
import { useLayoutEffect, useRef, useState } from "preact/hooks";

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
  const rowRef = useRef<HTMLDivElement>(null);
  const [isWrapped, setIsWrapped] = useState(false);
  const leaders = presetMembers.filter((pm) => pm.isLeader);
  const nonLeaders = presetMembers.filter((pm) => !pm.isLeader);
  const sorted = [...leaders, ...nonLeaders];

  useLayoutEffect(() => {
    const row = rowRef.current;

    if (!row) return;

    let frameId = 0;

    const measureWrap = () => {
      const firstChild = row.firstElementChild as HTMLElement | null;

      if (!firstChild) {
        setIsWrapped(false);
        return;
      }

      const firstTop = firstChild.offsetTop;
      const wrapped = Array.from(row.children).some(
        (child) => (child as HTMLElement).offsetTop !== firstTop,
      );

      setIsWrapped(wrapped);
    };

    const scheduleMeasure = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(measureWrap);
    };

    const resizeObserver = new ResizeObserver(() => {
      scheduleMeasure();
    });

    resizeObserver.observe(row);
    Array.from(row.children).forEach((child) => {
      resizeObserver.observe(child);
    });
    scheduleMeasure();

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [presetMembers]);

  return (
    <TertiarySection minSize fill>
      <Scroll axis="both">
        <Row ref={rowRef} wrap center={isWrapped}>
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
