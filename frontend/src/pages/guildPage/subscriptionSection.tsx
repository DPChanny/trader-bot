import { useState } from "react";
import { Column, Row } from "@components/atoms/layout";
import { SecondarySection } from "@components/surfaces/section";
import { Title, Text } from "@components/atoms/text";
import { PrimaryButton, DangerButton } from "@components/atoms/button";
import { Card } from "@components/surfaces/card";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { Select } from "@components/atoms/select";
import { BillingSelect } from "./billingSelect";
import { BillingAgree } from "./billingAgree";
import {
  useSubscription,
  useRegisterSubscription,
} from "@features/subscription/hook";
import { useBillings, useRequestBilling } from "@features/billing/hook";
import { useMyUser } from "@features/user/hook";
import { Plan } from "@features/subscription/dto";
import { PLAN_LABEL, PLAN_COLOR, PLAN_AMOUNT } from "./constants";

interface SubscriptionSectionProps {
  guildId: string;
  isOwner: boolean;
}

export function SubscriptionSection({
  guildId,
  isOwner,
}: SubscriptionSectionProps) {
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
  const { data: billings, isLoading: billingsLoading } = useBillings();
  const { requestBilling } = useRequestBilling();
  const { data: user } = useMyUser();

  const [isEditing, setIsEditing] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [editBillingId, setEditBillingId] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);

  const canSubscribeOrUpgrade =
    subscription == null || subscription.plan < Plan.PRO;

  const selectedPlan: Plan =
    editPlan ?? (subscription?.plan === Plan.PLUS ? Plan.PRO : Plan.PLUS);

  const selectedBillingId: number | null =
    editBillingId ?? billings?.[0]?.billingId ?? null;

  const immediateAmount: number = (() => {
    if (subscription == null) return PLAN_AMOUNT[selectedPlan];
    if (selectedPlan > subscription.plan)
      return Math.round(
        (PLAN_AMOUNT[selectedPlan] - PLAN_AMOUNT[subscription.plan]) *
          (Math.max(
            0,
            new Date(subscription.expiresAt).getTime() - Date.now(),
          ) /
            (30 * 24 * 60 * 60 * 1000)),
      );
    return PLAN_AMOUNT[selectedPlan];
  })();

  const closeEdit = () => {
    setIsEditing(false);
    setEditPlan(null);
    setEditBillingId(null);
    setAgreed(false);
  };

  const handleSubscribe = () => {
    if (selectedBillingId == null) return;
    registerSubscription(
      { guildId, dto: { billingId: selectedBillingId, plan: selectedPlan } },
      { onSuccess: closeEdit },
    );
  };

  const handleRequestBilling = () => {
    if (!user) return;
    requestBilling({ customerKey: `u-${user.discordId}` });
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

  return (
    <SecondarySection gap="sm">
      <Row align="center" justify="between">
        <Title>구독</Title>
        {isOwner &&
          canSubscribeOrUpgrade &&
          (isEditing ? (
            <DangerButton
              variantSize="small"
              onClick={closeEdit}
              disabled={isRegistering}
            >
              취소
            </DangerButton>
          ) : (
            <PrimaryButton
              variantSize="small"
              onClick={() => setIsEditing(true)}
            >
              {subscription == null ? "구독" : "업그레이드"}
            </PrimaryButton>
          ))}
      </Row>

      {subLoading ? (
        <Loading />
      ) : subError ? (
        <Error error={subError}>구독 정보를 불러오지 못했습니다</Error>
      ) : (
        <>
          <Card
            variantColor={subscription ? PLAN_COLOR[subscription.plan] : "gray"}
          >
            <Text variantWeight="semibold">
              {subscription ? PLAN_LABEL[subscription.plan] : "Trader Bot Free"}
            </Text>
            {statusText && <Text variantSize="small">{statusText}</Text>}
          </Card>

          {isOwner && isEditing && (
            <Column gap="xs">
              {registerError && (
                <Error error={registerError}>처리 중 오류가 발생했습니다</Error>
              )}
              {billingsLoading ? (
                <Loading />
              ) : (
                <Column gap="xs">
                  <Select
                    value={String(selectedPlan)}
                    onChange={(e) => {
                      setEditPlan(Number(e.target.value) as Plan);
                      setAgreed(false);
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
                  <BillingSelect
                    billings={billings ?? []}
                    value={selectedBillingId}
                    onChange={(id) => {
                      setEditBillingId(id);
                      setAgreed(false);
                    }}
                    onAdd={handleRequestBilling}
                    disabled={!user}
                  />
                  <BillingAgree
                    id="sub-autopay-agree"
                    checked={agreed}
                    onChange={setAgreed}
                  />
                  <PrimaryButton
                    variantSize="small"
                    style={{ width: "100%" }}
                    onClick={handleSubscribe}
                    disabled={
                      isRegistering || selectedBillingId == null || !agreed
                    }
                  >
                    ₩{immediateAmount.toLocaleString("ko-KR")} 결제 후 구독
                  </PrimaryButton>
                </Column>
              )}
            </Column>
          )}
        </>
      )}
    </SecondarySection>
  );
}
