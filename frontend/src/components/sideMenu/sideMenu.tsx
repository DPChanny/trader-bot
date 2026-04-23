import { useParams } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";
import styles from "@styles/components/sideMenu/sideMenu.module.css";
import { useGuilds } from "@features/guild/hook";

import { CloseButton } from "@components/atoms/button";
import { Fill, Row } from "@components/atoms/layout";
import { Title } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { GuildList } from "./guild/guildList";
import { PresetList } from "./preset/presetList";

const SIDE_MENU_WIDTH_REM = 20;
const DRAG_OPEN_THRESHOLD_RATIO = 0.25;
const SIDE_MENU_TRANSITION_MS = 250;

function getSideMenuWidthPx() {
  if (typeof window === "undefined") {
    return SIDE_MENU_WIDTH_REM * 16;
  }

  const rootFontSize = Number.parseFloat(
    window.getComputedStyle(document.documentElement).fontSize,
  );

  return SIDE_MENU_WIDTH_REM * (Number.isNaN(rootFontSize) ? 16 : rootFontSize);
}

export function SideMenu() {
  const guilds = useGuilds();
  const { guildId } = useParams({ strict: false }) as { guildId?: string };
  const { presetId: presetIdStr } = useParams({ strict: false }) as { presetId?: string };
  const presetId = presetIdStr ? parseInt(presetIdStr, 10) : undefined;
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isDraggingOpen, setIsDraggingOpen] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const dragStartXRef = useRef<number | null>(null);
  const openFrameRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (openFrameRef.current !== null) {
        window.cancelAnimationFrame(openFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isClosing) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setIsClosing(false);
    }, SIDE_MENU_TRANSITION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isClosing]);

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
      const nextOffsetRatio = nextOffsetPx / getSideMenuWidthPx();

      if (nextOffsetRatio >= DRAG_OPEN_THRESHOLD_RATIO) {
        setIsOpening(false);
        setIsClosing(false);
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

  const handleOpenDragStart = (event: React.PointerEvent<HTMLButtonElement>) => {
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

  const handleOpen = () => {
    if (isOpen || isOpening || isDraggingOpen) {
      return;
    }

    if (openFrameRef.current !== null) {
      window.cancelAnimationFrame(openFrameRef.current);
    }

    setIsOpening(true);
    setIsClosing(false);
    setIsOpen(false);
    setDragOffsetPx(0);
    openFrameRef.current = window.requestAnimationFrame(() => {
      setIsOpen(true);
      setIsOpening(false);
      openFrameRef.current = null;
    });
  };

  const handleClose = () => {
    if (openFrameRef.current !== null) {
      window.cancelAnimationFrame(openFrameRef.current);
      openFrameRef.current = null;
    }

    setIsOpening(false);
    setIsOpen(false);
    setIsClosing(true);
    setIsDraggingOpen(false);
    setDragOffsetPx(0);
    dragStartXRef.current = null;
  };

  const shouldRenderLayer = isOpen || isOpening || isDraggingOpen || isClosing;
  const shellTranslateX = isOpen ? "0" : `calc(-100% + ${dragOffsetPx}px)`;

  return (
    <div
      className={styles.root}
      style={{ width: "var(--side-menu-rail-width)" }}
    >
      <button
        type="button"
        className={styles.edgeTrigger}
        onClick={handleOpen}
        onPointerDown={handleOpenDragStart}
        title="사이드메뉴 펼치기"
      />
      {shouldRenderLayer && (
        <div className={clsx(styles.layer, isOpen && styles.layerOpen)}>
          <button
            type="button"
            className={styles.backdrop}
            onClick={handleClose}
            aria-label="사이드메뉴 닫기"
          />
          <div
            className={clsx(
              styles.shell,
              isClosing && styles.shellInactive,
              isDraggingOpen && styles.shellDragging,
            )}
            style={{
              width: "20rem",
              transform: `translateX(${shellTranslateX})`,
            }}
          >
            <Fill padding="lg" className={styles.panel}>
              <Row justify="between" align="center">
                <Title>사이드 메뉴</Title>
                <CloseButton onClick={handleClose} />
              </Row>
              <Bar />
              <Fill>
                <GuildList guilds={guilds.data ?? []} activeGuildId={guildId ?? null} />
                {guildId && <PresetList selectedPresetId={presetId ?? null} />}
              </Fill>
            </Fill>
          </div>
        </div>
      )}
    </div>
  );
}
