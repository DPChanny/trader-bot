import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { useGuilds } from "@/hooks/guild";
import { GuildCard } from "./guildCard";
import { Section } from "@/components/commons/section";
import { PageContainer, PageLayout } from "@/components/commons/page";
import { Loading } from "@/components/commons/loading";
import { Error } from "@/components/commons/error";
import { Bar } from "@/components/commons/bar";
import { useGuildContext } from "@/contexts/guildContext";
import { isAuthenticated } from "@/utils/auth";
import styles from "@/styles/pages/guild/guildPage.module.css";

interface GuildPageProps {
  path?: string;
}

export function GuildPage({}: GuildPageProps) {
  const { data: guilds, isLoading, error } = useGuilds();
  const { setGuild } = useGuildContext();

  useEffect(() => {
    if (!isAuthenticated()) {
      route("/auth/login", true);
    }
  }, []);

  const handleSelectGuild = (guildId: string) => {
    const guild = guilds?.find((g) => g.discordId === guildId);
    if (guild) {
      setGuild(guild);
      route("/preset");
    }
  };

  return (
    <PageLayout>
      <PageContainer>
        <Section variantIntent="primary" className={styles.mainSection}>
          <h3>길드 선택</h3>
          <Bar />
          {error && (
            <Error detail={error?.message}>
              길드 목록을 불러오는데 실패했습니다.
            </Error>
          )}
          {isLoading && <Loading />}
          {!isLoading && !error && (
            <div class={styles.guildList}>
              {guilds?.map((guild) => (
                <GuildCard
                  key={guild.discordId}
                  guild={guild}
                  onClick={handleSelectGuild}
                />
              ))}
              {guilds?.length === 0 && (
                <p class={styles.empty}>소속된 길드가 없습니다.</p>
              )}
            </div>
          )}
        </Section>
      </PageContainer>
    </PageLayout>
  );
}
