import { useParams, useNavigate } from "@tanstack/react-router";
import { Page, Column, Fill, Row } from "@components/atoms/layout";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";
import { NameTitle, Title, Text } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { EditButton } from "@components/atoms/button";
import { Card } from "@components/surfaces/card";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { useGuild } from "@features/guild/hook";
import { useSubscription } from "@features/subscription/hook";
import { useVerifyRole } from "@features/member/hook";
import { Plan } from "@features/subscription/dto";
import { Role } from "@features/member/dto";
import { MemberEditor } from "./memberEditor/memberEditor";

const PLAN_LABEL: Record<Plan, string> = {
  [Plan.PLUS]: "Trader Bot Plus ",
  [Plan.PRO]: "Trader Bot Pro",
};

const PLAN_COLOR: Record<Plan, "green" | "gold"> = {
  [Plan.PLUS]: "green",
  [Plan.PRO]: "gold",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
  }).format(new Date(iso));
}

export function GuildPage() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const navigate = useNavigate();

  const guild = useGuild(guildId);
  const isOwner = useVerifyRole(guildId, Role.OWNER);

  const {
    data: subscription,
    isLoading: subLoading,
    error: subError,
  } = useSubscription(guildId);

  const isFree =
    subscription == null || new Date(subscription.expiresAt) <= new Date();

  return (
    <Page>
      <PrimarySection minSize overflow="hidden" style={{ width: "25rem" }}>
        <NameTitle>{guild.data?.name ?? "로딩중"}</NameTitle>
        <Bar />

        <Fill overflow="auto">
          <Column gap="md" fill>
            <SecondarySection gap="sm">
              <Row justify="between" align="center">
                <Title>구독</Title>
                {isOwner && (
                  <EditButton
                    variantSize="small"
                    onClick={() =>
                      void navigate({
                        to: "/guild/$guildId/subscription",
                        params: { guildId },
                      })
                    }
                  />
                )}
              </Row>

              {subLoading ? (
                <Loading />
              ) : subError ? (
                <Error error={subError}>구독 정보를 불러오지 못했습니다</Error>
              ) : (
                <Card
                  variantColor={
                    isFree ? "gray" : PLAN_COLOR[subscription!.plan]
                  }
                >
                  <Text variantWeight="semibold">
                    {isFree ? "FREE" : PLAN_LABEL[subscription!.plan]}
                  </Text>
                  <Text variantSize="small">
                    {isFree ? "없음" : formatDate(subscription!.expiresAt)} 까지
                    {" -> "}
                    {!isFree &&
                      subscription!.nextPlan !== null &&
                      PLAN_LABEL[subscription!.nextPlan!]}
                  </Text>
                </Card>
              )}
            </SecondarySection>
          </Column>
        </Fill>
      </PrimarySection>

      <MemberEditor />
    </Page>
  );
}
