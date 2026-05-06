import { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { Column, Fill, Row } from "@components/atoms/layout";
import {
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Text } from "@components/atoms/text";
import { PrimaryButton, DangerButton } from "@components/atoms/button";
import { Badge } from "@components/atoms/badge";
import { Card } from "@components/surfaces/card";
import { InternalLink } from "@components/atoms/link";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import {
  useSubscription,
  useRegisterSubscription,
  useCancelSubscription,
} from "@features/subscription/hook";
import { usePayments } from "@features/payment/hook";
import { useBillings } from "@features/billing/hook";
import { useVerifyRole } from "@features/member/hook";
import { Tier } from "@features/subscription/dto";
import { Role } from "@features/member/dto";
import { BackendErrorCode } from "@utils/error";

const TIER_LABEL: Record<Tier, string> = {
  [Tier.PLUS]: "Plus",
  [Tier.PRO]: "Pro",
};

const TIER_COLOR: Record<Tier, "gold" | "blue"> = {
  [Tier.PLUS]: "gold",
  [Tier.PRO]: "blue",
};

const TIER_PRICE: Record<Tier, string> = {
  [Tier.PLUS]: "₩10,000/월",
  [Tier.PRO]: "₩20,000/월",
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function SubscriptionEditor() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };
  const isAdmin = useVerifyRole(guildId, Role.ADMIN);

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
  const [selectedTier, setSelectedTier] = useState<Tier>(Tier.PLUS);

  useEffect(() => {
    if (subscription?.billingId) {
      setSelectedBillingId(subscription.billingId);
      setSelectedTier(subscription.tier);
    }
  }, [subscription]);

  const isNotFound = subError?.code === BackendErrorCode.Subscription.NotFound;
  const isCancelled = subscription != null && subscription.billingId === null;
  const isActive =
    subscription != null &&
    subscription.billingId !== null &&
    new Date(subscription.expiresAt) > new Date();

  const effectiveBillingId =
    selectedBillingId ?? billings?.[0]?.billingId ?? null;

  const handleRegister = () => {
    if (effectiveBillingId === null) return;
    registerSubscription({
      guildId,
      dto: { billingId: effectiveBillingId, tier: selectedTier },
    });
  };

  return (
    <Fill overflow="auto">
      <Column gap="md">
        <SecondarySection>
          <Column gap="sm">
            <Text variantWeight="semibold" align="start">
              구독 현황
            </Text>
            {subLoading ? (
              <Loading />
            ) : subError && !isNotFound ? (
              <Error error={subError}>구독 정보를 불러오지 못했습니다</Error>
            ) : isNotFound || !subscription ? (
              <Text variantSize="small">구독 중이 아닙니다</Text>
            ) : (
              <Column gap="xs">
                <Row align="center" gap="sm">
                  <Badge variantColor={TIER_COLOR[subscription.tier]}>
                    {TIER_LABEL[subscription.tier]}
                  </Badge>
                  {isCancelled ? (
                    <Badge variantColor="red">취소됨</Badge>
                  ) : isActive ? (
                    <Badge variantColor="green">활성</Badge>
                  ) : (
                    <Badge variantColor="gray">만료</Badge>
                  )}
                </Row>
                <Text variantSize="small" align="start">
                  만료일: {formatDate(subscription.expiresAt)}
                </Text>
              </Column>
            )}
          </Column>
        </SecondarySection>

        {isAdmin && (
          <SecondarySection>
            <Column gap="md">
              <Row justify="between" align="center">
                <Text variantWeight="semibold" align="start">
                  플랜 관리
                </Text>
                {subscription && !isCancelled && (
                  <DangerButton
                    variantSize="small"
                    onClick={() => cancelSubscription({ guildId })}
                    disabled={isCancelling}
                  >
                    구독 취소
                  </DangerButton>
                )}
              </Row>

              <Column gap="xs">
                <Text
                  variantSize="small"
                  variantWeight="semibold"
                  align="start"
                >
                  결제 수단
                </Text>
                {billingsLoading ? (
                  <Loading />
                ) : !billings?.length ? (
                  <TertiarySection>
                    <Column gap="sm">
                      <Text variantSize="small">
                        등록된 결제 수단이 없습니다
                      </Text>
                      <InternalLink to="/me">
                        <Text variantSize="small" tone="accent">
                          내 계정에서 카드를 추가하세요
                        </Text>
                      </InternalLink>
                    </Column>
                  </TertiarySection>
                ) : (
                  <Column gap="xs">
                    {billings.map((b, i) => (
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
                )}
              </Column>

              <Column gap="xs">
                <Text
                  variantSize="small"
                  variantWeight="semibold"
                  align="start"
                >
                  플랜
                </Text>
                <Row gap="sm">
                  {([Tier.PLUS, Tier.PRO] as Tier[]).map((tier) => (
                    <Card
                      key={tier}
                      fill
                      variantColor={
                        selectedTier === tier ? TIER_COLOR[tier] : "gray"
                      }
                      onClick={() => setSelectedTier(tier)}
                      style={{ cursor: "pointer" }}
                    >
                      <Column gap="xs">
                        <Text variantWeight="semibold">{TIER_LABEL[tier]}</Text>
                        <Text variantSize="small">{TIER_PRICE[tier]}</Text>
                      </Column>
                    </Card>
                  ))}
                </Row>
              </Column>

              <PrimaryButton
                onClick={handleRegister}
                disabled={effectiveBillingId === null || isRegistering}
              >
                {subscription
                  ? isCancelled
                    ? "재구독"
                    : "플랜 변경"
                  : "구독 시작"}
              </PrimaryButton>
            </Column>
          </SecondarySection>
        )}

        {isAdmin && (
          <SecondarySection>
            <Column gap="md">
              <Text variantWeight="semibold" align="start">
                결제 내역
              </Text>
              {paymentsLoading ? (
                <Loading />
              ) : !payments?.length ? (
                <TertiarySection>
                  <Text variantSize="small">결제 내역이 없습니다</Text>
                </TertiarySection>
              ) : (
                <TertiarySection>
                  <Column gap="sm">
                    {[...payments].reverse().map((p) => (
                      <Card
                        key={p.paymentId}
                        direction="row"
                        align="center"
                        justify="between"
                        variantColor="gray"
                      >
                        <Badge variantColor={TIER_COLOR[p.tier]}>
                          {TIER_LABEL[p.tier]}
                        </Badge>
                        <Text variantSize="small" tone="accent">
                          {p.orderId.slice(0, 12)}…
                        </Text>
                      </Card>
                    ))}
                  </Column>
                </TertiarySection>
              )}
            </Column>
          </SecondarySection>
        )}
      </Column>
    </Fill>
  );
}
