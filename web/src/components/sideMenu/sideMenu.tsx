import styles from "@/styles/components/sideMenu/sideMenu.module.css";
import { useGuilds } from "@/hooks/guild";
import { useActiveGuildRoute, useSideMenuUrlState } from "@/hooks/router";
import { Button, CloseButton } from "@/components/commons/button";
import { Section } from "@/components/commons/section";
import { Bar } from "@/components/commons/bar";
import { GuildList } from "./guild/guildList";
import { PresetList } from "./preset/presetList";

export function SideMenu() {
  const { data: guilds = [] } = useGuilds();
  const { activeGuildId, selectedPresetId } = useActiveGuildRoute();
  const { isOpen, setOpen } = useSideMenuUrlState();

  return (
    <>
      {isOpen && (
        <Section className={styles.wrapper}>
          <Section
            variantTone="ghost"
            variantLayout="column"
            className={styles.sideMenu}
          >
            <Section variantTone="ghost" variantLayout="row">
              <h3>메뉴</h3>
              <CloseButton
                onClick={() => setOpen(false)}
                aria-label="사이드메뉴 닫기"
              />
            </Section>
            <Bar />
            <Section variantIntent="secondary">
              <GuildList guilds={guilds} activeGuildId={activeGuildId} />
            </Section>
            {activeGuildId && (
              <Section variantIntent="secondary">
                <PresetList
                  guildId={activeGuildId}
                  selectedPresetId={selectedPresetId}
                />
              </Section>
            )}
          </Section>
        </Section>
      )}
      {!isOpen && (
        <div className={styles.collapsedBar}>
          <Button
            className={styles.toggleTab}
            onClick={() => setOpen(true)}
            aria-label="사이드메뉴 펼치기"
          >
            ▶
          </Button>
        </div>
      )}
    </>
  );
}
