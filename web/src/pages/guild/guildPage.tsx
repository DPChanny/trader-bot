import { useGuild } from "@/hooks/guild";
import { usePreset } from "@/hooks/preset";
import { PresetEditor } from "./presetEditor/presetEditor";
import { MemberEditor } from "./memberEditor/memberEditor";
import styles from "@/styles/pages/guild/guildPage.module.css";

interface GuildPageProps {
  guildId: string;
  presetId: number | null;
}

export function GuildPage({ guildId, presetId }: GuildPageProps) {
  const { data: guild } = useGuild(guildId);
  const { data: preset } = usePreset(guildId, presetId);
  const isPresetRoute = presetId !== null;

  return (
    <div className={styles.guildContent}>
      {isPresetRoute ? (
        <PresetEditor preset={preset ?? null} />
      ) : guild ? (
        <MemberEditor guild={guild} />
      ) : null}
    </div>
  );
}
