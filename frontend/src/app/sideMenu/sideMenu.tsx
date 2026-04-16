import { useState } from "preact/hooks";
import styles from "@styles/sideMenu/sideMenu.module.css";
import { useGuilds } from "@hooks/guild";
import { useGuildRoute } from "@hooks/router";
import { Button, CloseButton } from "@components/atoms/button";
import { Row } from "@components/atoms/layout";
import { Title } from "@components/atoms/text";
import { PrimarySection } from "@components/molecules/section";
import { Bar } from "@components/atoms/bar";
import { GuildList } from "./guild/guildList";
import { PresetList } from "./preset/presetList";

export function SideMenu() {
  const guilds = useGuilds();
  const { guildId, presetId } = useGuildRoute();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && (
        <PrimarySection minSize overflow="y" style={{ width: "25rem" }}>
          <Row justify="between">
            <Title>메뉴</Title>
            <CloseButton
              onClick={() => setIsOpen(false)}
              aria-label="사이드메뉴 닫기"
            />
          </Row>
          <Bar />
          <GuildList guilds={guilds.data ?? []} activeGuildId={guildId} />
          {guildId && (
            <PresetList guildId={guildId} selectedPresetId={presetId} />
          )}
        </PrimarySection>
      )}
      {!isOpen && (
        <Button
          variantContent="icon"
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
