import { useState } from "react";
import { useParams } from "@tanstack/react-router";
import { Page, Column, Fill, Row } from "@components/atoms/layout";
import { PrimarySection, SecondarySection } from "@components/surfaces/section";
import { NameTitle, Title, Text } from "@components/atoms/text";
import { Bar } from "@components/atoms/bar";
import { PrimaryButton } from "@components/atoms/button";
import { Card } from "@components/surfaces/card";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { Select } from "@components/atoms/select";
import { InternalLink } from "@components/atoms/link";
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
  [Plan.PLUS]: 10_000,
  [Plan.PRO]: 20_000,
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

  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [editBillingId, setEditBillingId] = useState<number | "none" | null>(
    null,
  );

  // derived state
  const isActive = subscription != null;
  const hasBillingConn = isActive && subscription.billingId != null;
  const hasDowngrade =
    hasBillingConn &&
    subscription?.nextPlan != null &&
    subscription?.nextPlan !== subscription?.plan;
  const isFree = !isActive;

  const s3Plan =
    editPlan ?? subscription?.nextPlan ?? subscription?.plan ?? Plan.PLUS;
  const s3EffectiveBillingId: number | "none" =
    editBillingId !== null
      ? editBillingId
      : subscription?.billingId != null
        ? subscription.billingId
        : isFree
          ? (billings?.[0]?.billingId ?? "none")
          : "none";

  const handleAddBilling = async () => {
    if (!user) return;
    const billing = await addBilling({ customerKey: `u-${user.discordId}` });
    if (billing) {
      setEditBillingId(billing.billingId);
    }
  };

  const handleS3Save = () => {
    if (s3EffectiveBillingId === "none") {
      if (!isActive) return;
      cancelSubscription(
        { guildId },
        {
          onSuccess: () => {
            setEditBillingId(null);
          },
        },
      );
      return;
    }
    registerSubscription(
      { guildId, dto: { billingId: s3EffectiveBillingId, plan: s3Plan } },
      {
        onSuccess: () => {
          setEditPlan(null);
          setEditBillingId(null);
        },
      },
    );
  };

  const statusText = (() => {
    if (!subscription) return null;
    const date = new Date(subscription.expiresAt).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!hasBillingConn) return `${date} 만료`;
    if (hasDowngrade && subscription.nextPlan != null)
      return `${date} ${PLAN_LABEL[subscription.nextPlan]} 자동 결제`;
    return `${date} 자동 결제`;
  })();

  const actionError = registerError ?? cancelError ?? addBillingError;
  const isBusy = isRegistering || isCancelling;

  const immediateAmount = (() => {
    if (s3EffectiveBillingId === "none") return null;
    if (isActive && subscription && s3Plan > subscription.plan) {
      const remaining = Math.max(
        0,
        new Date(subscription.expiresAt).getTime() - Date.now(),
      );
      const ratio = remaining / (30 * 24 * 60 * 60 * 1000);
      return Math.round(
        (PLAN_AMOUNT[s3Plan] - PLAN_AMOUNT[subscription.plan]) * ratio,
      );
    }
    if (isFree) return PLAN_AMOUNT[s3Plan];
    return null;
  })();

  const infoText =
    s3EffectiveBillingId !== "none"
      ? "자동 결제에 동의한 것으로 간주됩니다."
      : null;

  const buttonLabel =
    immediateAmount != null
      ? `₩${immediateAmount.toLocaleString("ko-KR")} 결제 후 ${hasBillingConn ? "저장" : "구독"}`
      : isActive
        ? "저장"
        : "구독";

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

                      {!billingsLoading && (!!billings?.length || isActive) && (
                        <Column gap="xs">
                          <Select
                            value={String(s3Plan)}
                            onChange={(e) =>
                              setEditPlan(Number(e.target.value) as Plan)
                            }
                            variantSize="small"
                          >
                            <option value={String(Plan.PLUS)}>
                              Plus ₩10,000/월
                            </option>
                            <option value={String(Plan.PRO)}>
                              Pro ₩20,000/월
                            </option>
                          </Select>
                          <Row gap="xs" align="center">
                            <Select
                              value={
                                s3EffectiveBillingId === "none"
                                  ? "none"
                                  : String(s3EffectiveBillingId)
                              }
                              onChange={(e) => {
                                const v = e.target.value;
                                setEditBillingId(
                                  v === "none" ? "none" : Number(v),
                                );
                              }}
                              variantSize="small"
                              style={{ flex: 1 }}
                            >
                              {billings?.map((b) => (
                                <option
                                  key={b.billingId}
                                  value={String(b.billingId)}
                                >
                                  {b.name || "카드"}
                                </option>
                              ))}
                              {isActive &&
                                !(
                                  subscription && s3Plan > subscription.plan
                                ) && (
                                  <option value="none">자동 결제 없음</option>
                                )}
                            </Select>
                            <PrimaryButton
                              variantSize="small"
                              variantContent="icon"
                              onClick={handleAddBilling}
                              disabled={!user}
                            >
                              +
                            </PrimaryButton>
                          </Row>
                          {infoText && (
                            <Row gap="xs" align="center">
                              <Text variantSize="small">{infoText}</Text>
                              {immediateAmount != null && (
                                <Text variantSize="small">
                                  <InternalLink to="/terms-of-service">
                                    이용약관
                                  </InternalLink>
                                </Text>
                              )}
                            </Row>
                          )}
                          <PrimaryButton
                            variantSize="small"
                            style={{ width: "100%" }}
                            onClick={handleS3Save}
                            disabled={
                              isBusy ||
                              (isActive
                                ? editPlan === null && editBillingId === null
                                : s3EffectiveBillingId === "none")
                            }
                          >
                            {buttonLabel}
                          </PrimaryButton>
                        </Column>
                      )}

                      {isFree && billingsLoading && <Loading />}
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
