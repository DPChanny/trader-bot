import { PresetEditor } from "./presetEditor/presetEditor";
import { MemberEditor } from "./memberEditor/memberEditor";
import styles from "@/styles/pages/guild/guildPage.module.css";

interface GuildPageProps {
  guildId: string;
  presetId: number | null;
}

export function GuildPage({ guildId, presetId }: GuildPageProps) {
  return (
    <div className={styles.guildContent}>
      {presetId !== null ? (
        <PresetEditor guildId={guildId} presetId={presetId} />
      ) : (
        <MemberEditor guildId={guildId} />
      )}
    </div>
  );
}
