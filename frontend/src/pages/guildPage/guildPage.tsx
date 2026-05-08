import { useParams, useNavigate } from "@tanstack/react-router";
import { Page, Column, Fill, Row } from "@components/atoms/layout";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";
import { NameTitle, Title, Text } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { EditButton } from "@components/atoms/button";
import { Badge } from "@components/atoms/badge";
import { Card } from "@components/surfaces/card";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { useGuild } from "@features/guild/hook";
import { useSubscription } from "@features/subscription/hook";
import { useBillings } from "@features/billing/hook";
import { useVerifyRole } from "@features/member/hook";
import { Plan } from "@features/subscription/dto";
import { Role } from "@features/member/dto";
import { MemberEditor } from "./memberEditor/memberEditor";

const PLAN_LABEL: Record<Plan, string> = {
  [Plan.PLUS]: "Plus",
  [Plan.PRO]: "Pro",
};

const PLAN_COLOR: Record<Plan, "green" | "gold"> = {
  [Plan.PLUS]: "green",
  [Plan.PRO]: "gold",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function GuildPage() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const navigate = useNavigate();

  const guild = useGuild(guildId);
  const isAdmin = useVerifyRole(guildId, Role.ADMIN);

  const {
    data: subscription,
    isLoading: subLoading,
    error: subError,
  } = useSubscription(guildId);
  const { data: billings } = useBillings();

  const isCancelled = subscription != null && subscription.billingId === null;
  const isActive =
    subscription != null &&
    subscription.billingId !== null &&
    new Date(subscription.expiresAt) > new Date();
  const isFree = subscription === null || isCancelled || !isActive;

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
                {isAdmin && (
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
                  <Row justify="between" align="center">
                    <Column gap="xs">
                      <Text variantWeight="semibold">
                        {isFree ? "FREE" : PLAN_LABEL[subscription!.plan]}
                      </Text>
                      <Text variantSize="small">
                        만료일:{" "}
                        {isFree ? "없음" : formatDate(subscription!.expiresAt)}
                      </Text>
                      <Text variantSize="small">
                        결제 수단:{" "}
                        {(() => {
                          if (isFree) return "없음";
                          const idx = billings?.findIndex(
                            (b) => b.billingId === subscription!.billingId,
                          );
                          return idx !== undefined && idx >= 0
                            ? `#${idx + 1}`
                            : "없음";
                        })()}
                      </Text>
                    </Column>
                    {!isFree && <Badge variantColor="green">활성</Badge>}
                  </Row>
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
