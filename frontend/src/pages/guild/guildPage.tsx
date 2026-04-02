import { useEffect } from "preact/hooks";
import { route } from "preact-router";
import { useGuilds, useGuildInviteUrl } from "@/hooks/guild";
import { GuildCard } from "./guildCard";
import { PrimaryButton } from "@/components/button";
import { Section } from "@/components/section";
import { PageContainer, PageLayout } from "@/components/page";
import { Loading } from "@/components/loading";
import { Error } from "@/components/error";
import { Bar } from "@/components/bar";
import { setGuild } from "@/utils/guild";
import { isAuthenticated } from "@/utils/auth";
import type { Guild } from "@/dto";
import styles from "@/styles/pages/guild/guildPage.module.css";

interface GuildPageProps {
  path?: string;
}

export function GuildPage({}: GuildPageProps) {
  const { data: guilds, isLoading, error } = useGuilds();
  const guildInvite = useGuildInviteUrl();

  useEffect(() => {
    if (!isAuthenticated()) {
      route("/auth/login", true);
    }
  }, []);

  const handleSelectGuild = (guildId: number) => {
    const guild = guilds?.find((g: Guild) => g.guildId === guildId);
    if (guild) {
      setGuild({ guildId: guild.guildId, name: guild.name });
      route("/preset");
    }
  };

  const handleInvite = async () => {
    try {
      const result = await guildInvite.mutateAsync();
      window.open(result.url, "_blank");
    } catch (err) {
      console.error("Failed to get invite URL:", err);
    }
  };

  return (
    <PageLayout>
      <PageContainer>
        <Section variantIntent="primary" className={styles.mainSection}>
          <Section variantTone="ghost" variantLayout="row">
            <h3>길드 선택</h3>
            <PrimaryButton
              onClick={handleInvite}
              disabled={guildInvite.isPending}
            >
              봇 초대
            </PrimaryButton>
          </Section>
          <Bar />
          {guildInvite.isError && (
            <Error detail={guildInvite.error?.message}>
              초대 링크를 가져오는데 실패했습니다.
            </Error>
          )}
          {error && (
            <Error detail={error?.message}>
              길드 목록을 불러오는데 실패했습니다.
            </Error>
          )}
          {isLoading && <Loading />}
          {!isLoading && !error && (
            <Section variantTone="ghost" variantIntent="secondary">
              {guilds?.map((guild: Guild) => (
                <GuildCard
                  key={guild.guildId}
                  guild={guild}
                  onClick={handleSelectGuild}
                />
              ))}
              {guilds?.length === 0 && (
                <p>
                  소속된 길드가 없습니다. 봇 초대 버튼으로 봇을 추가해주세요.
                </p>
              )}
            </Section>
          )}
        </Section>
      </PageContainer>
    </PageLayout>
  );
}
