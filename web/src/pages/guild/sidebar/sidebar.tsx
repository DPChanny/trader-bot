import { useState } from "preact/hooks";
import { useRouter } from "preact-router";
import styles from "@/styles/components/sidebar/sidebar.module.css";
import { Section } from "@/components/commons/section";
import { useGuilds } from "@/hooks/guild";
import { GuildList } from "./guild/guildList";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [router] = useRouter();

  const { data: guilds = [] } = useGuilds();

  // Parse URL: /guild/:guildId/preset/:presetId or /guild/:guildId/member
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

  if (collapsed) {
    return (
      <div className={styles.sidebarCollapsed}>
        <button
          type="button"
          className={styles.collapseButton}
          onClick={() => setCollapsed(false)}
          aria-label="사이드바 펼치기"
        >
          ▶
        </button>
      </div>
    );
  }

  return (
    <nav className={styles.sidebar}>
      <Section
        variantTone="ghost"
        variantLayout="row"
        className={styles.collapseRow}
      >
        <button
          type="button"
          className={styles.collapseButton}
          onClick={() => setCollapsed(true)}
          aria-label="사이드바 접기"
        >
          ◀
        </button>
      </Section>

      <GuildList
        guilds={guilds}
        activeGuildId={activeGuildId}
        selectedPresetId={presetId}
        editor={editor}
      />
    </nav>
  );
}
