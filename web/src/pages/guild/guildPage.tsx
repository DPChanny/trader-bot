import { PresetEditor } from "./presetEditor/presetEditor";
import { MemberEditor } from "./memberEditor/memberEditor";
import styles from "@/styles/pages/guild/guildPage.module.css";

interface GuildPageProps {
  guildId: string;
  presetId: number | null;
}

export function GuildPage({ guildId, presetId }: GuildPageProps) {
  const isPresetRoute = presetId !== null;

  return (
    <div className={styles.guildContent}>
      {isPresetRoute ? (
        <PresetEditor guildId={guildId} presetId={presetId} />
      ) : (
        <MemberEditor guildId={guildId} />
      )}
    </div>
  );
}
