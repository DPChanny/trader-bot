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
  useUpdateSubscription,
  useCancelSubscription,
} from "@features/subscription/hook";
import { useBillings, useRequestBilling } from "@features/billing/hook";
import { useMyUser } from "@features/user/hook";
import { useVerifyRole } from "@features/member/hook";
import { Plan, type UpdateSubscriptionDTO } from "@features/subscription/dto";
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

const FREE_FEATURES = ["프리셋 1개", "프리셋 복사 · 구성", "경매 (10분 만료)"];

const PLAN_FEATURES: Record<Plan, string[]> = {
  [Plan.PLUS]: [
    "프리셋 5개",
    "프리셋 추가 · 수정",
    "경매 (30분 만료)",
    "Trader Bot 명령어",
  ],
  [Plan.PRO]: ["프리셋 무제한", "경매 (60분 만료)", "추후 추가 기능"],
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
  const { mutate: updateSubscription } = useUpdateSubscription();
  const {
    mutate: cancelSubscription,
    isPending: isCancelling,
    error: cancelError,
  } = useCancelSubscription();
  const { data: billings, isLoading: billingsLoading } = useBillings();
  const { requestBilling: addBilling, error: addBillingError } =
    useRequestBilling();
  const { data: user } = useMyUser();

  const [editMode, setEditMode] = useState<"subscription" | "autopay" | null>(
    null,
  );
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [editBillingId, setEditBillingId] = useState<number | "none" | null>(
    null,
  );
  const [autoPayAgreed, setAutoPayAgreed] = useState(false);

  const closeEdit = () => {
    setEditMode(null);
    setEditPlan(null);
    setEditBillingId(null);
    setAutoPayAgreed(false);
  };

  const openEdit = (mode: "subscription" | "autopay") => {
    setEditMode(mode);
    setEditPlan(null);
    setEditBillingId(null);
    setAutoPayAgreed(false);
  };

  const subPlan: Plan =
    (editMode === "subscription" ? editPlan : null) ??
    (subscription?.plan === Plan.PLUS ? Plan.PRO : Plan.PLUS);
  const subBillingId: number | null =
    editMode === "subscription" &&
    editBillingId != null &&
    editBillingId !== "none"
      ? editBillingId
      : (billings?.[0]?.billingId ?? null);

  const immediateAmount: number = (() => {
    if (subscription == null) return PLAN_AMOUNT[subPlan];
    if (subPlan > subscription.plan)
      return Math.round(
        (PLAN_AMOUNT[subPlan] - PLAN_AMOUNT[subscription.plan]) *
          (Math.max(
            0,
            new Date(subscription.expiresAt).getTime() - Date.now(),
          ) /
            (30 * 24 * 60 * 60 * 1000)),
      );
    return PLAN_AMOUNT[subPlan];
  })();

  const subButtonLabel = `₩${immediateAmount.toLocaleString("ko-KR")} 결제 후 구독`;

  const canSubscribeOrUpgrade =
    subscription == null || subscription.plan < Plan.PRO;

  const handleSubscribe = () => {
    if (subBillingId == null) return;
    registerSubscription(
      { guildId, dto: { billingId: subBillingId, plan: subPlan } },
      { onSuccess: closeEdit },
    );
  };

  // --- 자동 결제 섹션 (다음 갱신 설정 → 즉시 결제 없음) ---
  const autoPayBillingId: number | "none" = (() => {
    if (editMode === "autopay" && editBillingId != null) return editBillingId;
    if (subscription?.billingId != null) {
      const exists = billings?.some(
        (b) => b.billingId === subscription.billingId,
      );
      if (exists) return subscription.billingId;
    }
    if (editMode === "autopay" && editPlan != null)
      return billings?.[0]?.billingId ?? "none";
    return "none";
  })();

  // "none" plan = 자동 결제 없음 (billingId가 none일 때)
  const autoPayPlan: Plan | "none" =
    autoPayBillingId === "none"
      ? "none"
      : ((editMode === "autopay" ? editPlan : null) ??
        subscription?.nextPlan ??
        subscription?.plan ??
        Plan.PLUS);

  const autoPayHasChange =
    subscription != null &&
    (autoPayPlan === "none"
      ? subscription.billingId != null
      : autoPayPlan !== (subscription.nextPlan ?? subscription.plan) ||
        autoPayBillingId !== (subscription.billingId ?? "none"));

  const handleAutoPaySave = () => {
    if (autoPayBillingId === "none") {
      cancelSubscription({ guildId }, { onSuccess: closeEdit });
      return;
    }
    const dto: UpdateSubscriptionDTO = {
      billingId: autoPayBillingId,
    };
    const effectivePlan = autoPayPlan as Plan;
    dto.nextPlan = effectivePlan !== subscription?.plan ? effectivePlan : null;
    updateSubscription({ guildId, dto }, { onSuccess: closeEdit });
  };

  // --- 공통 ---
  const handleAddBilling = async () => {
    if (!user) return;
    const billing = await addBilling({ customerKey: `u-${user.discordId}` });
    if (billing) {
      setEditBillingId(billing.billingId);
      setAutoPayAgreed(false);
    }
  };

  const statusDate =
    subscription != null
      ? new Date(subscription.expiresAt).toLocaleDateString("ko-KR", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : null;

  const statusText = statusDate != null ? `${statusDate} 만료` : null;

  const actionError = registerError ?? cancelError ?? addBillingError;
  const isBusy = isRegistering || isCancelling;

  return (
    <Page>
      <PrimarySection minSize overflow="hidden" style={{ width: "25rem" }}>
        <NameTitle>{guild.data?.name ?? "로딩중"}</NameTitle>
        <Bar />

        <Fill overflow="auto">
          <Column gap="md" fill>
            {/* 구독 섹션: 최초 구독 · 업그레이드 */}
            <SecondarySection gap="sm">
              <Row align="center" justify="between">
                <Title>구독</Title>
                {isOwner &&
                  canSubscribeOrUpgrade &&
                  editMode !== "subscription" && (
                    <PrimaryButton
                      variantSize="small"
                      onClick={() => openEdit("subscription")}
                    >
                      {subscription == null ? "구독" : "업그레이드"}
                    </PrimaryButton>
                  )}
              </Row>

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

                  {isOwner && editMode === "subscription" && (
                    <Column gap="xs">
                      {actionError && (
                        <Error error={actionError}>
                          처리 중 오류가 발생했습니다
                        </Error>
                      )}
                      {billingsLoading ? (
                        <Loading />
                      ) : (
                        <Column gap="xs">
                          <Select
                            value={String(subPlan)}
                            onChange={(e) => {
                              setEditPlan(Number(e.target.value) as Plan);
                              setAutoPayAgreed(false);
                            }}
                            variantSize="small"
                          >
                            {(
                              Object.values(Plan).filter(
                                (p) =>
                                  typeof p === "number" &&
                                  p > (subscription?.plan ?? -1),
                              ) as Plan[]
                            ).map((p) => (
                              <option key={p} value={String(p)}>
                                {PLAN_LABEL[p]} (30일) ₩
                                {PLAN_AMOUNT[p].toLocaleString("ko-KR")}/월
                              </option>
                            ))}
                          </Select>
                          {billings?.length ? (
                            <Row gap="xs" align="center">
                              <Select
                                value={
                                  subBillingId != null
                                    ? String(subBillingId)
                                    : ""
                                }
                                onChange={(e) => {
                                  setEditBillingId(Number(e.target.value));
                                  setAutoPayAgreed(false);
                                }}
                                variantSize="small"
                                style={{ flex: 1 }}
                              >
                                {billings.map((b) => (
                                  <option
                                    key={b.billingId}
                                    value={String(b.billingId)}
                                  >
                                    {b.name || "카드"}
                                  </option>
                                ))}
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
                          ) : (
                            <PrimaryButton
                              variantSize="small"
                              onClick={handleAddBilling}
                              disabled={!user}
                            >
                              결제 수단 추가
                            </PrimaryButton>
                          )}
                          <Row align="center" justify="center">
                            <input
                              type="checkbox"
                              id="sub-auto-pay-agree"
                              checked={autoPayAgreed}
                              onChange={(e) =>
                                setAutoPayAgreed(e.target.checked)
                              }
                            />
                            <label
                              htmlFor="sub-auto-pay-agree"
                              style={{ fontSize: "0.75rem", cursor: "pointer" }}
                            >
                              자동 결제에 동의합니다. (
                              <InternalLink to="/terms-of-service">
                                이용약관
                              </InternalLink>
                              )
                            </label>
                          </Row>
                          <Row gap="xs">
                            <PrimaryButton
                              variantSize="small"
                              style={{ flex: 1 }}
                              onClick={closeEdit}
                              disabled={isBusy}
                            >
                              취소
                            </PrimaryButton>
                            <PrimaryButton
                              variantSize="small"
                              style={{ flex: 1 }}
                              onClick={handleSubscribe}
                              disabled={
                                isBusy || subBillingId == null || !autoPayAgreed
                              }
                            >
                              {subButtonLabel}
                            </PrimaryButton>
                          </Row>
                        </Column>
                      )}
                    </Column>
                  )}
                </>
              )}
            </SecondarySection>

            {/* 자동 결제 섹션: 다음 갱신 플랜·카드 설정 */}
            {isOwner && subscription != null && (
              <SecondarySection gap="sm">
                <Title>자동 결제</Title>

                {actionError && (
                  <Error error={actionError}>처리 중 오류가 발생했습니다</Error>
                )}
                {billingsLoading ? (
                  <Loading />
                ) : (
                  <Column gap="xs">
                    <Select
                      value={
                        autoPayPlan === "none" ? "none" : String(autoPayPlan)
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === "none") {
                          setEditBillingId("none");
                          setEditPlan(null);
                        } else {
                          if (editBillingId === "none") setEditBillingId(null);
                          setEditPlan(Number(v) as Plan);
                        }
                        setAutoPayAgreed(false);
                      }}
                      variantSize="small"
                    >
                      <option value={String(Plan.PLUS)}>
                        Trader Bot Plus (30일) ₩10,000/월
                      </option>
                      <option value={String(Plan.PRO)}>
                        Trader Bot Pro (30일) ₩20,000/월
                      </option>
                      <option value="none">자동 결제 없음</option>
                    </Select>
                    {autoPayPlan !== "none" && (
                      <Row gap="xs" align="center">
                        {billings?.length ? (
                          <>
                            <Select
                              value={String(autoPayBillingId)}
                              onChange={(e) => {
                                setEditBillingId(Number(e.target.value));
                                setAutoPayAgreed(false);
                              }}
                              variantSize="small"
                              style={{ flex: 1 }}
                            >
                              {billings.map((b) => (
                                <option
                                  key={b.billingId}
                                  value={String(b.billingId)}
                                >
                                  {b.name || "카드"}
                                </option>
                              ))}
                            </Select>
                            <PrimaryButton
                              variantSize="small"
                              variantContent="icon"
                              onClick={handleAddBilling}
                              disabled={!user}
                            >
                              +
                            </PrimaryButton>
                          </>
                        ) : (
                          <PrimaryButton
                            variantSize="small"
                            onClick={handleAddBilling}
                            disabled={!user}
                          >
                            결제 수단 추가
                          </PrimaryButton>
                        )}
                      </Row>
                    )}
                    {autoPayHasChange && autoPayPlan !== "none" && (
                      <Text variantSize="small">
                        만료일에 위 항목으로 자동 결제됩니다.
                      </Text>
                    )}
                    {autoPayHasChange && autoPayPlan !== "none" && (
                      <Row align="center" justify="center">
                        <input
                          type="checkbox"
                          id="autopay-agree"
                          checked={autoPayAgreed}
                          onChange={(e) => setAutoPayAgreed(e.target.checked)}
                        />
                        <label
                          htmlFor="autopay-agree"
                          style={{ fontSize: "0.75rem", cursor: "pointer" }}
                        >
                          자동 결제 설정에 동의합니다. (
                          <InternalLink to="/terms-of-service">
                            이용약관
                          </InternalLink>
                          )
                        </label>
                      </Row>
                    )}
                    <PrimaryButton
                      variantSize="small"
                      style={{ width: "100%" }}
                      onClick={handleAutoPaySave}
                      disabled={
                        isBusy ||
                        !autoPayHasChange ||
                        (autoPayPlan !== "none" && !autoPayAgreed)
                      }
                    >
                      저장
                    </PrimaryButton>
                  </Column>
                )}
              </SecondarySection>
            )}

            <SecondarySection fill>
              <Title>구독 플랜</Title>
              <Card variantColor="gray" fill justify="center">
                <Text variantWeight="semibold">Trader Bot Free</Text>
                {FREE_FEATURES.map((f) => (
                  <Text key={f} variantSize="small">
                    • {f}
                  </Text>
                ))}
              </Card>
              <Card variantColor="green" fill justify="center">
                <Text variantWeight="semibold">
                  Trader Bot Plus (30일) ₩10,000/월
                </Text>
                {PLAN_FEATURES[Plan.PLUS].map((f) => (
                  <Text key={f} variantSize="small">
                    • {f}
                  </Text>
                ))}
              </Card>
              <Card variantColor="gold" fill justify="center">
                <Text variantWeight="semibold">
                  Trader Bot Pro (30일) ₩20,000/월
                </Text>
                {PLAN_FEATURES[Plan.PRO].map((f) => (
                  <Text key={f} variantSize="small">
                    • {f}
                  </Text>
                ))}
              </Card>
            </SecondarySection>
          </Column>
        </Fill>
      </PrimarySection>
      <MemberEditor />
    </Page>
  );
}
