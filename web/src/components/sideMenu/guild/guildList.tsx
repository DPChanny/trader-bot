import { Layout, Row } from "@/components/commons/layout";
import {
  SecondarySection,
  TertiarySection,
} from "@/components/commons/section";
import { PrimaryButton } from "@/components/commons/button";
import { GuildCard } from "./guildCard";
import type { GuildDetailDTO } from "@/dtos/guild";
import { getBotInviteUrl } from "@/utils/env";
import styles from "@/styles/components/sideMenu/guild/guildList.module.css";

interface GuildListProps {
  guilds: GuildDetailDTO[];
  activeGuildId: string | null;
}

export function GuildList({ guilds, activeGuildId }: GuildListProps) {
  return (
    <SecondarySection className={styles.wrapper}>
      <Row style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h3>길드 관리</h3>
        <PrimaryButton onClick={() => window.open(getBotInviteUrl(), "_blank")}>
          추가
        </PrimaryButton>
      </Row>
      <Layout fill>
        <TertiarySection>
          {guilds.map((g) => (
            <GuildCard
              key={g.discordId}
              guild={g}
              isSelected={activeGuildId === g.discordId}
            />
          ))}
        </TertiarySection>
      </Layout>
    </SecondarySection>
  );
}
