import { useState } from "preact/hooks";
import { route } from "preact-router";
import { Section } from "@/components/commons/section";
import { Bar } from "@/components/commons/bar";
import { GuildCard } from "./guildCard";
import { SidebarPresetList } from "./presetList";
import styles from "@/styles/components/sidebar/guildList.module.css";
import type { GuildDTO } from "@/dtos/guildDto";

interface GuildListProps {
  guilds: GuildDTO[];
  activeGuildId: string | null;
  selectedPresetId: number | null;
  subPage: "preset" | "member";
}

export function GuildList({
  guilds,
  activeGuildId,
  selectedPresetId,
  subPage,
}: GuildListProps) {
  const [open, setOpen] = useState(true);

  return (
    <Section
      variantTone="ghost"
      variantLayout="column"
      className={styles.guildListSection}
    >
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className={`${styles.arrow} ${open ? styles.arrowOpen : ""}`}>
          ▶
        </span>
        <span className={styles.sectionLabel}>길드</span>
      </button>

      {open && (
        <Section
          variantTone="ghost"
          variantLayout="column"
          className={styles.guildItems}
        >
          {guilds.map((g) => {
            const isActive = activeGuildId === g.discordId;
            return (
              <div key={g.discordId} className={styles.guildGroup}>
                <GuildCard
                  guild={g}
                  isActive={isActive}
                  onClick={() => route(`/guild/${g.discordId}/preset`)}
                />

                {isActive && (
                  <Section
                    variantTone="ghost"
                    variantLayout="column"
                    className={styles.guildSub}
                  >
                    <Bar />
                    <SidebarPresetList
                      guildId={g.discordId}
                      selectedPresetId={selectedPresetId}
                      subPage={subPage}
                    />
                    <button
                      type="button"
                      className={`${styles.navBtn} ${
                        subPage === "member" ? styles.navBtnActive : ""
                      }`}
                      onClick={() => route(`/guild/${g.discordId}/member`)}
                    >
                      멤버
                    </button>
                  </Section>
                )}
              </div>
            );
          })}
        </Section>
      )}
    </Section>
  );
}
