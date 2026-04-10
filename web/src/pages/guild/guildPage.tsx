import { PresetEditor } from "./presetEditor/presetEditor";
import { MemberEditor } from "./memberEditor/memberEditor";
import { Sidebar } from "./sidebar/sidebar";
import styles from "@/styles/pages/guild/guildPage.module.css";

interface GuildPageProps {
  guildId: string | null;
  editor: "preset" | "member" | null;
  presetId: number | null;
}

export function GuildPage({ guildId, editor, presetId }: GuildPageProps) {
  return (
    <main className={styles.guildBody}>
      <Sidebar />
      <div className={styles.guildContent}>
        {guildId !== null && editor === "preset" ? (
          <PresetEditor guildId={guildId} presetId={presetId} />
        ) : guildId !== null && editor === "member" ? (
          <MemberEditor guildId={guildId} />
        ) : null}
      </div>
    </main>
  );
}
