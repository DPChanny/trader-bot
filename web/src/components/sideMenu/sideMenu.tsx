import { useState } from "preact/hooks";
import styles from "@/styles/components/sideMenu/sideMenu.module.css";
import { useGuilds } from "@/hooks/guild";
import { useGuildRoute } from "@/hooks/router";
import { Button, CloseButton } from "@/components/commons/button";
import { Row } from "@/components/commons/layout";
import { PrimarySection } from "@/components/commons/section";
import { Bar } from "@/components/commons/bar";
import { GuildList } from "./guild/guildList";
import { PresetList } from "./preset/presetList";

export function SideMenu() {
  const { data: guilds = [] } = useGuilds();
  const { guildId, presetId } = useGuildRoute();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <PrimarySection className={styles.sideMenu}>
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
        <Button
          className={styles.floatingToggle}
          onClick={() => setIsOpen(true)}
          aria-label="사이드메뉴 펼치기"
        >
          ▶
        </Button>
      )}
    </>
  );
}
