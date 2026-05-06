import { useState, useEffect } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Page, Column, Fill, Row } from "@components/atoms/layout";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { NameTitle, Title, Text } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import {
  PrimaryButton,
  DangerButton,
  SecondaryButton,
} from "@components/atoms/button";
import { Badge } from "@components/atoms/badge";
import { Card } from "@components/surfaces/card";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { useGuild } from "@features/guild/hook";
import {
  useSubscription,
  useRegisterSubscription,
  useCancelSubscription,
} from "@features/subscription/hook";
import { usePayments } from "@features/payment/hook";
import { useBillings } from "@features/billing/hook";
import { requestBillingAuth } from "@features/billing/api";
import { useMyUser } from "@features/user/hook";
import { Plan } from "@features/subscription/dto";
import { BackendErrorCode } from "@utils/error";

const PLAN_LABEL: Record<Plan, string> = {
  [Plan.PLUS]: "Plus",
  [Plan.PRO]: "Pro",
};

const PLAN_COLOR: Record<Plan, "gold" | "blue"> = {
  [Plan.PLUS]: "gold",
  [Plan.PRO]: "blue",
};

const PLAN_PRICE: Record<Plan, string> = {
  [Plan.PLUS]: "₩10,000/월",
  [Plan.PRO]: "₩20,000/월",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function SubscriptionPage() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const navigate = useNavigate();
  const { data: user } = useMyUser();

  const guild = useGuild(guildId);
  const {
    data: subscription,
    isLoading: subLoading,
    error: subError,
  } = useSubscription(guildId);
  const { data: billings, isLoading: billingsLoading } = useBillings();
  const { data: payments, isLoading: paymentsLoading } = usePayments(guildId);
  const { mutate: registerSubscription, isPending: isRegistering } =
    useRegisterSubscription();
  const { mutate: cancelSubscription, isPending: isCancelling } =
    useCancelSubscription();

  const [selectedBillingId, setSelectedBillingId] = useState<number | null>(
    null,
  );
  const [selectedPlan, setSelectedPlan] = useState<Plan>(Plan.PLUS);

  useEffect(() => {
    if (subscription?.billingId) {
      setSelectedBillingId(subscription.billingId);
      setSelectedPlan(subscription.plan);
    }
  }, [subscription]);

  const isNotFound = subError?.code === BackendErrorCode.Subscription.NotFound;
  const isCancelled = subscription != null && subscription.billingId === null;
  const isActive =
    subscription != null &&
    subscription.billingId !== null &&
    new Date(subscription.expiresAt) > new Date();
  const hasSub = subscription != null && !isNotFound;
  const isFree = !hasSub || isCancelled || !isActive;

  const effectiveBillingId =
    selectedBillingId ?? billings?.[0]?.billingId ?? null;

  const handleRegister = () => {
    if (effectiveBillingId === null) return;
    registerSubscription(
      { guildId, dto: { billingId: effectiveBillingId, plan: selectedPlan } },
      {
        onSuccess: () =>
          void navigate({ to: "/guild/$guildId/member", params: { guildId } }),
      },
    );
  };

  const handleCancel = () => {
    cancelSubscription(
      { guildId },
      {
        onSuccess: () =>
          void navigate({ to: "/guild/$guildId/member", params: { guildId } }),
      },
    );
  };

  const handleAddBilling = () => {
    if (!user) return;
    void requestBillingAuth({
      customerKey: user.discordId,
      redirectPath: `/guild/${guildId}/subscription`,
    });
  };

  return (
    <Page>
      <PrimarySection minSize overflow="hidden" style={{ width: "25rem" }}>
        <Row align="center" gap="sm">
          <SecondaryButton
            variantSize="small"
            onClick={() =>
              void navigate({
                to: "/guild/$guildId/member",
                params: { guildId },
              })
            }
          >
            ← 뒤로
          </SecondaryButton>
          <NameTitle>{guild.data?.name ?? "로딩중"}</NameTitle>
        </Row>
        <Bar />

        <Fill overflow="auto">
          <Column gap="md" fill>
            <SecondarySection gap="sm">
              <Title>현재 구독</Title>
              {subLoading ? (
                <Loading />
              ) : subError && !isNotFound ? (
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
                    </Column>
                    {!isFree && <Badge variantColor="green">활성</Badge>}
                  </Row>
                </Card>
              )}
            </SecondarySection>

            <SecondarySection gap="sm">
              <Row justify="between" align="center">
                <Title>결제 수단</Title>
                <PrimaryButton
                  variantSize="small"
                  onClick={handleAddBilling}
                  disabled={!user}
                >
                  추가
                </PrimaryButton>
              </Row>
              {billingsLoading ? (
                <TertiarySection fill>
                  <Loading />
                </TertiarySection>
              ) : (
                <TertiarySection fill>
                  <Column gap="xs">
                    {billings?.map((b, i) => (
                      <Card
                        key={b.billingId}
                        direction="row"
                        align="center"
                        variantColor={
                          effectiveBillingId === b.billingId ? "blue" : "gray"
                        }
                        onClick={() => setSelectedBillingId(b.billingId)}
                        style={{ cursor: "pointer" }}
                      >
                        <Text>결제 수단 #{i + 1}</Text>
                      </Card>
                    ))}
                  </Column>
                </TertiarySection>
              )}
            </SecondarySection>

            <SecondarySection gap="sm">
              <Title>플랜</Title>
              <Row gap="sm">
                {([Plan.PLUS, Plan.PRO] as Plan[]).map((plan) => (
                  <Card
                    key={plan}
                    fill
                    center
                    variantColor={
                      selectedPlan === plan ? PLAN_COLOR[plan] : "gray"
                    }
                    onClick={() => setSelectedPlan(plan)}
                    style={{ cursor: "pointer" }}
                  >
                    <Text variantWeight="semibold">{PLAN_LABEL[plan]}</Text>
                    <Text variantSize="small">{PLAN_PRICE[plan]}</Text>
                  </Card>
                ))}
              </Row>
            </SecondarySection>

            <SecondarySection fill gap="md">
              <Title>결제 내역</Title>
              {paymentsLoading ? (
                <TertiarySection fill>
                  <Loading />
                </TertiarySection>
              ) : (
                <TertiarySection fill>
                  <Column gap="sm">
                    {[...(payments ?? [])].reverse().map((p) => (
                      <Card
                        key={p.paymentId}
                        direction="row"
                        align="center"
                        justify="between"
                        variantColor="gray"
                      >
                        <Badge variantColor={PLAN_COLOR[p.plan]}>
                          {PLAN_LABEL[p.plan]}
                        </Badge>
                        <Text variantSize="small" tone="accent">
                          {p.orderId.slice(0, 12)}…
                        </Text>
                      </Card>
                    ))}
                  </Column>
                </TertiarySection>
              )}
            </SecondarySection>
          </Column>
        </Fill>
      </PrimarySection>

      <PrimarySection fill>
        <Row justify="between" align="center">
          {!isFree && (
            <DangerButton
              variantSize="small"
              onClick={handleCancel}
              disabled={isCancelling}
            >
              구독 취소
            </DangerButton>
          )}
          <Row gap="sm" justify="end" fill>
            <PrimaryButton
              variantSize="small"
              onClick={handleRegister}
              disabled={effectiveBillingId === null || isRegistering}
            >
              {isFree ? "구독 시작" : "변경"}
            </PrimaryButton>
          </Row>
        </Row>
      </PrimarySection>
    </Page>
  );
}
