import { useState } from "preact/hooks";
import styles from "@styles/sideMenu/sideMenu.module.css";
import { useGuilds } from "@hooks/guild";
import { useGuildRoute } from "@hooks/router";
import { CloseButton } from "@components/atoms/button";
import { Row } from "@components/atoms/layout";
import { Micro } from "@components/atoms/text";
import { PrimarySection } from "@components/molecules/section";
import { Bar } from "@components/atoms/bar";
import { GuildList } from "./guild/guildList";
import { PresetList } from "./preset/presetList";

export function SideMenu() {
  const { data: guilds = [] } = useGuilds();
  const { guildId, presetId } = useGuildRoute();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <PrimarySection
          minSize
          overflow="y"
          style={{ width: "20rem", height: "100%", flexShrink: 0 }}
        >
          <Row gap="sm" justify="between" align="center">
            <h3>메뉴</h3>
            <CloseButton
              onClick={() => setIsOpen(false)}
              aria-label="사이드메뉴 닫기"
            />
          </Row>
          <Bar />
          <GuildList guilds={guilds} activeGuildId={guildId} />
          {guildId && (
            <PresetList guildId={guildId} selectedPresetId={presetId} />
          )}
        </PrimarySection>
      )}
      {!isOpen && (
        <button
          type="button"
          className={styles.floatingToggle}
          onClick={() => setIsOpen(true)}
          aria-label="사이드메뉴 펼치기"
        >
          <Micro>▶</Micro>
        </button>
      )}
    </>
  );
}
