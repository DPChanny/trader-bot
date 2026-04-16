import { useEffect, useRef, useState } from "preact/hooks";
import styles from "@styles/sideMenu/sideMenu.module.css";
import { useGuilds } from "@hooks/guild";
import { useGuildId, usePresetId } from "@hooks/router";
import { CloseButton } from "@components/atoms/button";
import { Fill, Layout, Row } from "@components/atoms/layout";
import { Title } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { GuildList } from "./guild/guildList";
import { PresetList } from "./preset/presetList";

export function SideMenu() {
  const guilds = useGuilds();
  const guildId = useGuildId();
  const presetId = usePresetId();
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown, true);
    };
  }, [isOpen]);

  return (
    <Layout
      className={styles.root}
      style={{
        width: "var(--side-menu-rail-width)",
      }}
    >
      <button
        type="button"
        className={styles.edgeTrigger}
        onClick={() => setIsOpen(true)}
        title="사이드메뉴 펼치기"
      />
      {isOpen && (
        <Layout className={styles.layer}>
          <Layout className={styles.shell} style={{ width: "20rem" }}>
            <div ref={panelRef} className={styles.panelHost}>
              <Fill padding="lg" className={styles.panel}>
                <Row justify="between" align="center">
                  <Title>메뉴</Title>
                  <CloseButton onClick={() => setIsOpen(false)} />
                </Row>
                <Bar />
                <Fill>
                  <GuildList
                    guilds={guilds.data ?? []}
                    activeGuildId={guildId}
                  />
                  {guildId && (
                    <PresetList guildId={guildId} selectedPresetId={presetId} />
                  )}
                </Fill>
              </Fill>
            </div>
          </Layout>
        </Layout>
      )}
    </Layout>
  );
}
