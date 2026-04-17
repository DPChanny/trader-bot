import { useEffect, useRef, useState } from "preact/hooks";
import { clsx } from "clsx";
import styles from "@styles/sideMenu/sideMenu.module.css";
import { useGuilds } from "@hooks/guild";
import { useOptionalGuildId, useOptionalPresetId } from "@hooks/router";
import { CloseButton } from "@components/atoms/button";
import { Fill, Row } from "@components/atoms/layout";
import { Title } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { GuildList } from "./guild/guildList";
import { PresetList } from "./preset/presetList";

const DRAG_OPEN_THRESHOLD_PX = 100;

export function SideMenu() {
  const guilds = useGuilds();
  const guildId = useOptionalGuildId();
  const presetId = useOptionalPresetId();
  const [isOpen, setIsOpen] = useState(false);
  const [isDraggingOpen, setIsDraggingOpen] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const dragStartXRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isDraggingOpen) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragStartX = dragStartXRef.current;
      if (dragStartX === null) {
        return;
      }

      const nextOffsetPx = Math.max(0, event.clientX - dragStartX);

      if (nextOffsetPx >= DRAG_OPEN_THRESHOLD_PX) {
        setIsOpen(true);
        setIsDraggingOpen(false);
        setDragOffsetPx(0);
        dragStartXRef.current = null;
        return;
      }

      setDragOffsetPx(nextOffsetPx);
    };

    const handlePointerEnd = () => {
      setIsDraggingOpen(false);
      setDragOffsetPx(0);
      dragStartXRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [isDraggingOpen]);

  const handleOpenDragStart = (event: PointerEvent) => {
    if (isOpen) {
      return;
    }

    if (event.button !== 0) {
      return;
    }

    dragStartXRef.current = event.clientX;
    setDragOffsetPx(0);
    setIsDraggingOpen(true);
  };

  const shouldRenderLayer = isOpen || isDraggingOpen;
  const shellTranslateX = isOpen ? "0" : `calc(-100% + ${dragOffsetPx}px)`;

  return (
    <div
      className={styles.root}
      style={{ width: "var(--side-menu-rail-width)" }}
    >
      <button
        type="button"
        className={styles.edgeTrigger}
        onClick={() => setIsOpen(true)}
        onPointerDown={handleOpenDragStart}
        title="사이드메뉴 펼치기"
      />
      {shouldRenderLayer && (
        <div className={clsx(styles.layer, isOpen && styles.layerOpen)}>
          <button
            type="button"
            className={styles.backdrop}
            onClick={() => setIsOpen(false)}
            aria-label="사이드메뉴 닫기"
          />
          <div
            className={clsx(
              styles.shell,
              isDraggingOpen && styles.shellDragging,
            )}
            style={{
              width: "20rem",
              transform: `translateX(${shellTranslateX})`,
            }}
          >
            <div className={styles.panelHost}>
              <Fill padding="lg" className={styles.panel}>
                <Row justify="between" align="center">
                  <Title>사이드 메뉴</Title>
                  <CloseButton onClick={() => setIsOpen(false)} />
                </Row>
                <Bar />
                <Fill>
                  <GuildList
                    guilds={guilds.data ?? []}
                    activeGuildId={guildId}
                  />
                  {guildId && <PresetList selectedPresetId={presetId} />}
                </Fill>
              </Fill>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
