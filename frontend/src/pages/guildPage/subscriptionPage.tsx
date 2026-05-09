import { useState } from "react";
import { useParams, useNavigate } from "@tanstack/react-router";
import { Page, Column, Row, Fill, Scroll } from "@components/atoms/layout";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Title, Text } from "@components/atoms/text";
import { Button, PrimaryButton, DangerButton } from "@components/atoms/button";
import { Card } from "@components/surfaces/card";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { Footer } from "@components/footer";
import {
  useSubscription,
  useRegisterSubscription,
  useCancelSubscription,
} from "@features/subscription/hook";
import { useBillings, useRequestBilling } from "@features/billing/hook";
import { useMyUser } from "@features/user/hook";
import { Plan } from "@features/subscription/dto";

type SelectedPlan = Plan | null; // null = FREE

const FREE_COLOR = "blue" as const;

const PLAN_COLOR: Record<Plan, "green" | "gold"> = {
  [Plan.PLUS]: "green",
  [Plan.PRO]: "gold",
};

type PlanDetail = {
  label: string;
  price: string;
  color: "blue" | "green" | "gold";
  description: string;
  features: string[];
};

const FREE_DETAIL: PlanDetail = {
  label: "FREE",
  price: "₩0/월",
  color: "blue",
  description: "무료로 기본 기능을 사용해보세요.",
  features: ["기본 경매 기능", "소규모 서버에 적합"],
};

const PLAN_DETAIL: Record<Plan, PlanDetail> = {
  [Plan.PLUS]: {
    label: "Plus",
    price: "₩10,000/월",
    color: "green",
    description: "더 많은 기능과 함께 서버를 운영하세요.",
    features: ["기본 경매 기능", "확장된 멤버 지원", "우선 지원"],
  },
  [Plan.PRO]: {
    label: "Pro",
    price: "₩20,000/월",
    color: "gold",
    description: "모든 기능을 제한 없이 사용하세요.",
    features: ["모든 경매 기능", "무제한 멤버 지원", "전담 지원"],
  },
};

export function SubscriptionPage() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const navigate = useNavigate();
  const { data: user } = useMyUser();

  const { data: subscription, isLoading: subLoading } =
    useSubscription(guildId);
  const { data: billings, isLoading: billingsLoading } = useBillings();
  const {
    mutate: registerSubscription,
    isPending: isRegistering,
    error: registerError,
  } = useRegisterSubscription();
  const {
    mutate: cancelSubscription,
    isPending: isCancelling,
    error: cancelError,
  } = useCancelSubscription();
  const { requestBilling: addBilling, error: addBillingError } =
    useRequestBilling();

  const [selectedBillingId, setSelectedBillingId] = useState<number | null>(
    null,
  );
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>(Plan.PLUS);

  const isFree =
    subscription == null || new Date(subscription.expiresAt) <= new Date();

  const effectiveBillingId =
    selectedBillingId ??
    (isFree ? null : subscription?.billingId) ??
    billings?.[0]?.billingId ??
    null;

  const handleAddBilling = () => {
    if (!user) return;
    void addBilling({ customerKey: `u-${user.discordId}` });
  };

  const handleDeactivate = () => {
    cancelSubscription({ guildId });
  };

  const handleSubscribe = () => {
    if (selectedPlan === null || effectiveBillingId === null) return;
    registerSubscription(
      { guildId, dto: { billingId: effectiveBillingId, plan: selectedPlan } },
      {
        onSuccess: () =>
          void navigate({
            to: "/guild/$guildId/member",
            params: { guildId },
          }),
      },
    );
  };

  const effectivePlan = subscription?.nextPlan ?? subscription?.plan ?? null;

  const isCurrentPlan =
    selectedPlan !== null &&
    !isFree &&
    effectivePlan === selectedPlan &&
    subscription?.billingId === effectiveBillingId;

  const isDowngrade =
    selectedPlan !== null &&
    !isFree &&
    effectivePlan !== null &&
    selectedPlan < effectivePlan;

  const subscribeDisabled =
    selectedPlan === null ||
    isCurrentPlan ||
    effectiveBillingId === null ||
    isRegistering ||
    isCancelling ||
    (subLoading && subscription === undefined);

  const detail =
    selectedPlan === null ? FREE_DETAIL : PLAN_DETAIL[selectedPlan];

  return (
    <Page>
      <Scroll>
        <Column align="center" style={{ minHeight: "100%" }}>
          <PrimarySection width="page" style={{ flex: 1 }}>
            <SecondarySection gap="sm">
              <Title>구독 플랜</Title>
              <Row gap="sm">
                <Fill>
                  <Button
                    variantTone="ghost"
                    isPressed={selectedPlan === null}
                    onClick={() => setSelectedPlan(null)}
                  >
                    <Card fill center variantColor={FREE_COLOR}>
                      <Text variantWeight="semibold">FREE</Text>
                      <Text variantSize="small">₩0/월</Text>
                    </Card>
                  </Button>
                </Fill>
                {([Plan.PLUS, Plan.PRO] as Plan[]).map((plan) => (
                  <Fill key={plan}>
                    <Button
                      variantTone="ghost"
                      isPressed={selectedPlan === plan}
                      onClick={() => setSelectedPlan(plan)}
                    >
                      <Card fill center variantColor={PLAN_COLOR[plan]}>
                        <Text variantWeight="semibold">
                          {PLAN_DETAIL[plan].label}
                        </Text>
                        <Text variantSize="small">
                          {PLAN_DETAIL[plan].price}
                        </Text>
                      </Card>
                    </Button>
                  </Fill>
                ))}
              </Row>
              <Card variantColor={detail.color}>
                <Column gap="md">
                  <Row justify="between" align="center">
                    <Title>{detail.label}</Title>
                    <Text variantWeight="semibold">{detail.price}</Text>
                  </Row>
                  <Text>{detail.description}</Text>
                  <Column gap="xs">
                    {detail.features.map((f) => (
                      <Text key={f}>• {f}</Text>
                    ))}
                  </Column>
                </Column>
              </Card>
            </SecondarySection>

            <SecondarySection fill gap="sm">
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
                <TertiarySection fill center>
                  <Loading />
                </TertiarySection>
              ) : !billings?.length ? (
                <TertiarySection fill center>
                  <Text>등록된 결제 수단이 없습니다.</Text>
                </TertiarySection>
              ) : (
                <TertiarySection fill gap="xs">
                  {billings.map((b) => (
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
                      <Fill>
                        <Text>{b.name || "카드"}</Text>
                      </Fill>
                    </Card>
                  ))}
                </TertiarySection>
              )}
            </SecondarySection>

            <SecondarySection gap="xs">
              {(registerError ?? cancelError ?? addBillingError) && (
                <Error
                  error={(registerError ?? cancelError ?? addBillingError)!}
                >
                  처리 중 오류가 발생했습니다
                </Error>
              )}
              <Text variantSize="small" tone="accent">
                {isDowngrade
                  ? "다운그레이드는 현재 구독 만료 후 다음 결제 주기부터 적용됩니다."
                  : "연결된 결제 수단으로 매월 자동 청구됩니다. 결제 수단 삭제를 통해 언제든지 자동결제를 중단할 수 있습니다."}
              </Text>
              <Fill>
                <PrimaryButton
                  variantSize="large"
                  onClick={handleSubscribe}
                  disabled={subscribeDisabled}
                >
                  구독 시작
                </PrimaryButton>
              </Fill>
              {!isFree && (
                <Fill>
                  <DangerButton
                    variantSize="large"
                    onClick={handleDeactivate}
                    disabled={isCancelling || isRegistering}
                  >
                    구독 중지
                  </DangerButton>
                </Fill>
              )}
            </SecondarySection>
          </PrimarySection>
          <Footer />
        </Column>
      </Scroll>
    </Page>
  );
}
