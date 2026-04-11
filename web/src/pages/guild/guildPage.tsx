import { PresetEditor } from "./presetEditor/presetEditor";
import { MemberEditor } from "./memberEditor/memberEditor";
import { useGuildRoute } from "@/hooks/router";
import styles from "@/styles/pages/guild/guildPage.module.css";

export function GuildPage() {
  const { guildId, presetId } = useGuildRoute();

  return (
    <div className={styles.guildContent}>
      {presetId !== null ? (
        <PresetEditor guildId={guildId!} presetId={presetId} />
      ) : (
        <MemberEditor guildId={guildId!} />
      )}
    </div>
  );
}
