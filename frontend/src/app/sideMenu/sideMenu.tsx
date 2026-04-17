import { useEffect, useRef, useState } from "preact/hooks";
import { clsx } from "clsx";
import styles from "@styles/sideMenu/sideMenu.module.css";
import { useGuilds } from "@hooks/guild";
import { useOptionalGuildId, useOptionalPresetId } from "@hooks/router";
import { CloseButton } from "@components/atoms/button";
import { Fill, Layout, Row } from "@components/atoms/layout";
import { Title } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { GuildList } from "./guild/guildList";
import { PresetList } from "./preset/presetList";

const DRAG_OPEN_THRESHOLD_RATIO = 0.35;
const DRAG_IGNORE_CLICK_MS = 250;

export function SideMenu() {
  const guilds = useGuilds();
  const guildId = useOptionalGuildId();
  const presetId = useOptionalPresetId();
  const [isOpen, setIsOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    startX: number;
    maxOffset: number;
    didMove: boolean;
  } | null>(null);
  const ignoreClickUntilRef = useRef(0);

  useEffect(() => {
    if (dragOffset === null) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      const nextOffset = Math.min(
        Math.max(event.clientX - dragState.startX, 0),
        dragState.maxOffset,
      );

      if (nextOffset > 6) {
        dragState.didMove = true;
      }

      setDragOffset(nextOffset);
    };

    const handlePointerEnd = () => {
      const dragState = dragStateRef.current;
      if (!dragState) {
        return;
      }

      const finalOffset = dragOffset ?? 0;
      const shouldOpen =
        finalOffset >= dragState.maxOffset * DRAG_OPEN_THRESHOLD_RATIO;

      if (dragState.didMove) {
        ignoreClickUntilRef.current = Date.now() + DRAG_IGNORE_CLICK_MS;
      }

      dragStateRef.current = null;
      setDragOffset(null);
      setIsOpen(shouldOpen);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [dragOffset]);

  const handleOpenClick = () => {
    if (Date.now() < ignoreClickUntilRef.current) {
      return;
    }

    setIsOpen(true);
  };

  const handleOpenDragStart = (event: PointerEvent) => {
    const shellWidth = shellRef.current?.offsetWidth ?? 320;
    const railWidth = rootRef.current?.offsetWidth ?? 12;
    const maxOffset = Math.max(shellWidth - railWidth, 0);

    dragStateRef.current = {
      startX: event.clientX,
      maxOffset,
      didMove: false,
    };
    setDragOffset(0);
  };

  const isVisible = isOpen || dragOffset !== null;
  const shellTransform =
    dragOffset === null
      ? undefined
      : `translateX(${dragOffset - (shellRef.current?.offsetWidth ?? 320) + (rootRef.current?.offsetWidth ?? 12)}px)`;
  const backdropOpacity =
    dragOffset === null
      ? undefined
      : Math.min(
          Math.max(dragOffset / (dragStateRef.current?.maxOffset ?? 1), 0),
          1,
        );

  return (
    <Layout
      ref={rootRef}
      className={styles.root}
      style={{
        width: "var(--side-menu-rail-width)",
      }}
    >
      <button
        type="button"
        className={styles.edgeTrigger}
        onClick={handleOpenClick}
        onPointerDown={handleOpenDragStart}
        title="사이드메뉴 펼치기"
      />
      <Layout className={clsx(styles.layer, isVisible && styles.layerOpen)}>
        <button
          type="button"
          className={styles.backdrop}
          onClick={() => setIsOpen(false)}
          aria-label="사이드메뉴 닫기"
          tabIndex={isVisible ? 0 : -1}
          style={
            backdropOpacity === undefined
              ? undefined
              : { opacity: backdropOpacity }
          }
        />
        <Layout
          ref={shellRef}
          className={styles.shell}
          style={
            shellTransform
              ? { width: "20rem", transform: shellTransform }
              : { width: "20rem" }
          }
        >
          <div className={styles.panelHost}>
            <Fill padding="lg" className={styles.panel}>
              <Row justify="between" align="center">
                <Title>메뉴</Title>
                <CloseButton onClick={() => setIsOpen(false)} />
              </Row>
              <Bar />
              <Fill>
                <GuildList guilds={guilds.data ?? []} activeGuildId={guildId} />
                {guildId && <PresetList selectedPresetId={presetId} />}
              </Fill>
            </Fill>
          </div>
        </Layout>
      </Layout>
    </Layout>
  );
}
