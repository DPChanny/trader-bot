import { PresetEditor } from "./presetEditor/presetEditor";
import { MemberEditor } from "./memberEditor/memberEditor";
import { Sidebar } from "./sidebar/sidebar";
import styles from "@/styles/pages/guild/guildPage.module.css";

interface GuildPageProps {
  guildId: string;
  editor: "preset" | "member" | null;
  presetId: number | null;
}

export function GuildPage({ guildId, editor, presetId }: GuildPageProps) {
  return (
    <main className={`app-main ${styles.guildBody}`}>
      <Sidebar />
      <div className={styles.guildContent}>
        {editor === "preset" ? (
          <PresetEditor guildId={guildId} presetId={presetId} />
        ) : editor === "member" ? (
          <MemberEditor guildId={guildId} />
        ) : null}
      </div>
    </main>
  );
}
