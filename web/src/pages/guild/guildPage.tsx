import { PresetEditor } from "@/pages/preset/presetEditor";
import { MemberEditor } from "@/pages/member/memberEditor";

interface GuildPageProps {
  guildId: string;
  subPage: "preset" | "member";
  presetId: number | null;
}

export function GuildPage({ guildId, subPage, presetId }: GuildPageProps) {
  return (
    <main className="app-main">
      {subPage === "preset" ? (
        <PresetEditor guildId={guildId} presetId={presetId} />
      ) : (
        <MemberEditor guildId={guildId} />
      )}
    </main>
  );
}
