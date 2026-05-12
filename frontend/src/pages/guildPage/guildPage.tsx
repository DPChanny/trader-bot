import { useParams } from "@tanstack/react-router";
import { Route } from "@routes/guild/$guildId/member";
import { Page, Column, Fill } from "@components/atoms/layout";
import { PrimarySection } from "@components/surfaces/section";
import { NameTitle } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { Error } from "@components/molecules/error";
import { useGuild } from "@features/guild/hook";
import { useBillingCallback } from "@features/billing/hook";
import { useVerifyRole } from "@features/member/hook";
import { Role } from "@features/member/dto";
import { SubscriptionSection } from "./subscriptionSection";
import { BillingSection } from "./billingSection";
import { PlanSection } from "./planSection";
import { MemberEditor } from "./memberEditor/memberEditor";

export function GuildPage() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const { authKey, code } = Route.useSearch();

  const guild = useGuild(guildId);
  const isOwner = useVerifyRole(guildId, Role.OWNER);
  const { error: billingCallbackError } = useBillingCallback({ authKey, code });

  return (
    <Page>
      <PrimarySection minSize overflow="hidden" style={{ width: "25rem" }}>
        <NameTitle>{guild.data?.name ?? "로딩중"}</NameTitle>
        <Bar />
        <Fill overflow="auto">
          <Column gap="md" fill>
            {billingCallbackError && (
              <Error error={billingCallbackError}>
                결제 수단 추가에 실패했습니다
              </Error>
            )}
            <SubscriptionSection guildId={guildId} isOwner={isOwner} />
            {isOwner && <BillingSection guildId={guildId} />}
            <PlanSection />
          </Column>
        </Fill>
      </PrimarySection>
      <MemberEditor />
    </Page>
  );
}