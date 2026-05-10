import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { Page, Column, Fill, Row } from "@components/atoms/layout";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";
import { NameTitle, Title, Text } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { Button, PrimaryButton, DangerButton } from "@components/atoms/button";
import { Card } from "@components/surfaces/card";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { useGuild } from "@features/guild/hook";
import {
  useSubscription,
  useRegisterSubscription,
  useCancelSubscription,
} from "@features/subscription/hook";
import { useBillings, useRequestBilling } from "@features/billing/hook";
import { useMyUser } from "@features/user/hook";
import { useVerifyRole } from "@features/member/hook";
import { Plan } from "@features/subscription/dto";
import { Role } from "@features/member/dto";
import { MemberEditor } from "./memberEditor/memberEditor";

const PLAN_LABEL: Record<Plan, string> = {
  [Plan.PLUS]: "Trader Bot Plus",
  [Plan.PRO]: "Trader Bot Pro",
};

const PLAN_COLOR: Record<Plan, "green" | "gold"> = {
  [Plan.PLUS]: "green",
  [Plan.PRO]: "gold",
};

const PLAN_AMOUNT: Record<Plan, number> = {
  [Plan.PLUS]: 10000,
  [Plan.PRO]: 20000,
};

export function GuildPage() {
  const { guildId } = useParams({ strict: false }) as { guildId: string };

  const guild = useGuild(guildId);
  const isOwner = useVerifyRole(guildId, Role.OWNER);

  const {
    data: subscription,
    isLoading: subLoading,
    error: subError,
  } = useSubscription(guildId);

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
  const { data: billings, isLoading: billingsLoading } = useBillings();
  const { requestBilling: addBilling, error: addBillingError } =
    useRequestBilling();
  const { data: user } = useMyUser();

  const [confirmType, setConfirmType] = useState<"stop" | "upgrade" | null>(
    null,
  );
  const [selectedBillingId, setSelectedBillingId] = useState<number | null>(
    null,
  );
  const [selectedPlan, setSelectedPlan] = useState<Plan>(Plan.PLUS);

  // derived state
  const isActive = subscription != null;
  const hasBillingConn = isActive && subscription.billingId != null;
  const isExpiring = isActive && !hasBillingConn;
  const hasDowngrade =
    hasBillingConn &&
    subscription?.nextPlan != null &&
    subscription?.nextPlan !== subscription?.plan;
  const isNormal = hasBillingConn && !hasDowngrade;
  const isFree = !isActive;

  const effectiveBillingId =
    selectedBillingId ?? billings?.[0]?.billingId ?? null;

  const handleAddBilling = () => {
    if (!user) return;
    void addBilling({ customerKey: `u-${user.discordId}` });
  };

  const upgradeProration = (() => {
    if (!isNormal || !subscription || subscription.plan !== Plan.PLUS) return 0;
    const remaining = Math.max(
      0,
      Math.ceil(
        (new Date(subscription.expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    return Math.round(
      (PLAN_AMOUNT[Plan.PRO] - PLAN_AMOUNT[Plan.PLUS]) * (remaining / 30),
    );
  })();

  const handleConfirm = () => {
    if (!subscription) return;
    if (confirmType === "upgrade") {
      registerSubscription(
        {
          guildId,
          dto: { billingId: subscription.billingId!, plan: Plan.PRO },
        },
        { onSuccess: () => setConfirmType(null) },
      );
    } else if (confirmType === "stop") {
      cancelSubscription(
        { guildId },
        { onSuccess: () => setConfirmType(null) },
      );
    }
  };

  const statusText = (() => {
    if (!subscription) return null;
    const date = new Date(subscription.expiresAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (isExpiring) return `${date} 만료 예정`;
    if (hasDowngrade && subscription.nextPlan != null)
      return `${date} ${PLAN_LABEL[subscription.nextPlan]} 자동 결제`;
    return `${date} 자동 결제`;
  })();

  const actionError = registerError ?? cancelError ?? addBillingError;
  const isBusy = isRegistering || isCancelling;

  return (
    <Page>
      <PrimarySection minSize overflow="hidden" style={{ width: "25rem" }}>
        <NameTitle>{guild.data?.name ?? "로딩중"}</NameTitle>
        <Bar />

        <Fill overflow="auto">
          <Column gap="md" fill>
            <SecondarySection gap="sm">
              <Title>구독</Title>

              {subLoading ? (
                <Loading />
              ) : subError ? (
                <Error error={subError}>구독 정보를 불러오지 못했습니다</Error>
              ) : (
                <>
                  {/* Status card */}
                  <Card
                    variantColor={
                      subscription ? PLAN_COLOR[subscription.plan] : "gray"
                    }
                  >
                    <Text variantWeight="semibold">
                      {subscription
                        ? PLAN_LABEL[subscription.plan]
                        : "Trader Bot Free"}
                    </Text>
                    {statusText && (
                      <Text variantSize="small">{statusText}</Text>
                    )}
                  </Card>

                  {isOwner && (
                    <Column gap="xs">
                      {actionError && (
                        <Error error={actionError}>
                          처리 중 오류가 발생했습니다
                        </Error>
                      )}

                      {/* S1: FREE, no billing */}
                      {isFree && !billingsLoading && !billings?.length && (
                        <Column gap="xs">
                          <Text variantSize="small">
                            구독을 시작하려면 결제 수단이 필요합니다.
                          </Text>
                          <PrimaryButton
                            variantSize="small"
                            onClick={handleAddBilling}
                            disabled={!user}
                          >
                            카드 등록
                          </PrimaryButton>
                        </Column>
                      )}

                      {/* S2: FREE, has billing */}
                      {isFree && !billingsLoading && !!billings?.length && (
                        <Column gap="sm">
                          <Row gap="xs">
                            {([Plan.PLUS, Plan.PRO] as Plan[]).map((plan) => (
                              <Button
                                key={plan}
                                variantTone="ghost"
                                isPressed={selectedPlan === plan}
                                onClick={() => setSelectedPlan(plan)}
                              >
                                {plan === Plan.PLUS
                                  ? "Plus ₩10,000"
                                  : "Pro ₩20,000"}
                              </Button>
                            ))}
                          </Row>
                          <Column gap="xs">
                            {billings.map((b) => (
                              <Button
                                key={b.billingId}
                                variantTone="ghost"
                                variantSize="small"
                                isPressed={effectiveBillingId === b.billingId}
                                onClick={() =>
                                  setSelectedBillingId(b.billingId)
                                }
                              >
                                {b.name || "카드"}
                              </Button>
                            ))}
                            <Button
                              variantTone="ghost"
                              variantSize="small"
                              onClick={handleAddBilling}
                              disabled={!user}
                            >
                              + 카드 추가
                            </Button>
                          </Column>
                          <Text variantSize="small">
                            구독 시 자동 결제에 동의한 것으로 간주됩니다.
                          </Text>
                          <PrimaryButton
                            variantSize="large"
                            onClick={() => {
                              if (effectiveBillingId == null) return;
                              registerSubscription({
                                guildId,
                                dto: {
                                  billingId: effectiveBillingId,
                                  plan: selectedPlan,
                                },
                              });
                            }}
                            disabled={isBusy || effectiveBillingId == null}
                          >
                            구독 시작
                          </PrimaryButton>
                        </Column>
                      )}

                      {/* billings loading (S1/S2 undetermined) */}
                      {isFree && billingsLoading && <Loading />}

                      {/* S3: Active, normal — actions */}
                      {isNormal && subscription && confirmType == null && (
                        <Column gap="xs">
                          {subscription.plan === Plan.PLUS && (
                            <PrimaryButton
                              variantSize="small"
                              onClick={() => setConfirmType("upgrade")}
                              disabled={isBusy}
                            >
                              PRO로 업그레이드
                            </PrimaryButton>
                          )}
                          {subscription.plan === Plan.PRO && (
                            <Button
                              variantTone="outline"
                              variantSize="small"
                              onClick={() => {
                                if (!subscription.billingId) return;
                                registerSubscription({
                                  guildId,
                                  dto: {
                                    billingId: subscription.billingId,
                                    plan: Plan.PLUS,
                                  },
                                });
                              }}
                              disabled={isBusy}
                            >
                              PLUS로 변경
                            </Button>
                          )}
                          <DangerButton
                            variantSize="small"
                            onClick={() => setConfirmType("stop")}
                            disabled={isBusy}
                          >
                            자동 결제 중지
                          </DangerButton>
                        </Column>
                      )}

                      {/* S3 confirm: upgrade */}
                      {isNormal && confirmType === "upgrade" && (
                        <Column gap="xs">
                          <Text variantSize="small">
                            {`지금 바로 ₩${upgradeProration.toLocaleString("ko-KR")}이 결제됩니다.`}
                          </Text>
                          <Row gap="xs">
                            <PrimaryButton
                              variantSize="small"
                              onClick={handleConfirm}
                              disabled={isRegistering}
                            >
                              결제
                            </PrimaryButton>
                            <Button
                              variantTone="outline"
                              variantSize="small"
                              onClick={() => setConfirmType(null)}
                            >
                              취소
                            </Button>
                          </Row>
                        </Column>
                      )}

                      {/* S3/S4 confirm: stop */}
                      {(isNormal || hasDowngrade) && confirmType === "stop" && (
                        <Column gap="xs">
                          <Text variantSize="small">
                            만료 후 Free로 전환됩니다.
                          </Text>
                          <Row gap="xs">
                            <DangerButton
                              variantSize="small"
                              onClick={handleConfirm}
                              disabled={isCancelling}
                            >
                              중지
                            </DangerButton>
                            <Button
                              variantTone="outline"
                              variantSize="small"
                              onClick={() => setConfirmType(null)}
                            >
                              취소
                            </Button>
                          </Row>
                        </Column>
                      )}

                      {/* S4: Downgrade pending */}
                      {hasDowngrade && subscription && confirmType == null && (
                        <Column gap="xs">
                          <Button
                            variantTone="outline"
                            variantSize="small"
                            onClick={() => {
                              if (!subscription.billingId) return;
                              registerSubscription({
                                guildId,
                                dto: {
                                  billingId: subscription.billingId,
                                  plan: subscription.plan,
                                },
                              });
                            }}
                            disabled={isBusy}
                          >
                            다운그레이드 취소
                          </Button>
                          <DangerButton
                            variantSize="small"
                            onClick={() => setConfirmType("stop")}
                            disabled={isBusy}
                          >
                            자동 결제 중지
                          </DangerButton>
                        </Column>
                      )}

                      {/* S5: Expiring, no billing */}
                      {isExpiring && !billingsLoading && !billings?.length && (
                        <Column gap="xs">
                          <Text variantSize="small">
                            결제 수단을 등록하면 자동 갱신됩니다.
                          </Text>
                          <PrimaryButton
                            variantSize="small"
                            onClick={handleAddBilling}
                            disabled={!user}
                          >
                            카드 등록
                          </PrimaryButton>
                        </Column>
                      )}

                      {/* S5: Expiring, has billing */}
                      {isExpiring &&
                        subscription &&
                        !billingsLoading &&
                        !!billings?.length && (
                          <Column gap="sm">
                            <Column gap="xs">
                              {billings.map((b) => (
                                <Button
                                  key={b.billingId}
                                  variantTone="ghost"
                                  variantSize="small"
                                  isPressed={effectiveBillingId === b.billingId}
                                  onClick={() =>
                                    setSelectedBillingId(b.billingId)
                                  }
                                >
                                  {b.name || "카드"}
                                </Button>
                              ))}
                              <Button
                                variantTone="ghost"
                                variantSize="small"
                                onClick={handleAddBilling}
                                disabled={!user}
                              >
                                + 카드 추가
                              </Button>
                            </Column>
                            <PrimaryButton
                              variantSize="large"
                              onClick={() => {
                                if (effectiveBillingId == null) return;
                                registerSubscription({
                                  guildId,
                                  dto: {
                                    billingId: effectiveBillingId,
                                    plan: subscription.plan,
                                  },
                                });
                              }}
                              disabled={isBusy || effectiveBillingId == null}
                            >
                              자동 결제 활성화
                            </PrimaryButton>
                          </Column>
                        )}

                      {/* billings loading (S5 undetermined) */}
                      {isExpiring && billingsLoading && <Loading />}
                    </Column>
                  )}
                </>
              )}
            </SecondarySection>
          </Column>
        </Fill>
      </PrimarySection>
      <MemberEditor />
    </Page>
  );
}
