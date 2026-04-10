import { useState } from "preact/hooks";
import { route, useRouter } from "preact-router";
import styles from "@/styles/components/sidebar/sidebar.module.css";
import { useGuilds } from "@/hooks/guild";
import { Button, CloseButton } from "@/components/commons/button";
import { Section } from "@/components/commons/section";
import { Card } from "@/components/commons/card";
import { Bar } from "@/components/commons/bar";
import { GuildList } from "./guild/guildList";
import { PresetList } from "./preset/presetList";

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const [router] = useRouter();

  const { data: guilds = [] } = useGuilds();

  const url = router.url ?? "";
  const guildMatch = url.match(/^\/guild\/([^\/]+)/);
  const activeGuildId = guildMatch ? guildMatch[1]! : null;
  const presetMatch = url.match(/\/preset\/(\d+)/);
  const presetId = presetMatch ? parseInt(presetMatch[1]!) : null;
  const editor: "preset" | "member" | null = url.includes("/member")
    ? "member"
    : url.includes("/preset")
      ? "preset"
      : null;

  return (
    <>
      {open && (
        <Section className={styles.wrapper}>
          <Section
            variantTone="ghost"
            variantLayout="column"
            className={styles.sidebar}
          >
            <Section
              variantTone="ghost"
              variantLayout="row"
              className={styles.panelHeader}
            >
              <h3>메뉴</h3>
              <CloseButton
                onClick={() => setOpen(false)}
                aria-label="사이드바 닫기"
              />
            </Section>
            <Bar />
            <Section variantIntent="secondary">
              <GuildList guilds={guilds} activeGuildId={activeGuildId} />
            </Section>
            {activeGuildId && (
              <>
                <Card
                  variantColor={editor === "member" ? "blue" : "gray"}
                  variantActive={editor === "member"}
                  variantLayout="row"
                  className={styles.memberCard}
                  onClick={() => route(`/guild/${activeGuildId}/member`)}
                  style={{ cursor: "pointer" }}
                >
                  멤버 관리
                </Card>
                <Section variantIntent="secondary">
                  <PresetList
                    guildId={activeGuildId}
                    selectedPresetId={editor === "preset" ? presetId : null}
                  />
                </Section>
              </>
            )}
          </Section>
        </Section>
      )}
      {!open && (
        <div className={styles.collapsedBar}>
          <Button
            className={styles.toggleTab}
            onClick={() => setOpen(true)}
            aria-label="사이드바 펼치기"
          >
            ▶
          </Button>
        </div>
      )}
    </>
  );
}
