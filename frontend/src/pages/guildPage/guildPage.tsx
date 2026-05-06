import { useParams } from "@tanstack/react-router";
import { Page } from "@components/atoms/layout";
import { PrimarySection } from "@components/surfaces/section";
import { NameTitle } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { useGuild } from "@features/guild/hook";
import { MemberEditor } from "./memberEditor/memberEditor";
import { SubscriptionEditor } from "./subscriptionEditor/subscriptionEditor";

export function GuildPage() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };

  const guild = useGuild(guildId);

  return (
    <Page>
      <PrimarySection minSize overflow="hidden" style={{ width: "25rem" }}>
        <NameTitle>{guild.data?.name ?? "로딩중"}</NameTitle>
        <Bar />
        <SubscriptionEditor />
      </PrimarySection>

      <MemberEditor />
    </Page>
  );
}
