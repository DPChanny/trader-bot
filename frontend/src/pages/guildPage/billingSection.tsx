import { useState } from "react";
import { Column } from "@components/atoms/layout";
import { SecondarySection } from "@components/surfaces/section";
import { Title, Text } from "@components/atoms/text";
import { PrimaryButton } from "@components/atoms/button";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { Select } from "@components/atoms/select";
import { BillingSelect } from "./billingSelect";
import { BillingAgree } from "./billingAgree";
import {
  useSubscription,
  useUpdateSubscription,
  useCancelSubscription,
} from "@features/subscription/hook";
import { useBillings, useRequestBilling } from "@features/billing/hook";
import { useMyUser } from "@features/user/hook";
import { Plan, type UpdateSubscriptionDTO } from "@features/subscription/dto";
import { PLAN_AMOUNT } from "./constants";

type BillingEdit = { plan: Plan | null; billingId: number | null };

export function BillingSection({ guildId }: { guildId: string }) {
  const { data: subscription } = useSubscription(guildId);
  const {
    mutate: updateSubscription,
    isPending: isUpdating,
    error: updateError,
  } = useUpdateSubscription();
  const {
    mutate: cancelSubscription,
    isPending: isCancelling,
    error: cancelError,
  } = useCancelSubscription();
  const { data: billings, isLoading: billingsLoading } = useBillings();
  const { requestBilling } = useRequestBilling();
  const { data: user } = useMyUser();

  const [edit, setEdit] = useState<BillingEdit | null>(null);
  const [agreed, setAgreed] = useState(false);

  if (subscription == null) return null;

  const subPlan: Plan | null =
    subscription.billingId != null
      ? (subscription.nextPlan ?? subscription.plan ?? Plan.PLUS)
      : null;
  const subBillingId: number | null = subscription.billingId ?? null;

  const resolvedBillingId: number | null =
    subBillingId != null && billings?.some((b) => b.billingId === subBillingId)
      ? subBillingId
      : (billings?.[0]?.billingId ?? null);

  const plan: Plan | null = edit !== null ? edit.plan : subPlan;
  const billingId: number | null =
    edit !== null ? edit.billingId : resolvedBillingId;

  const hasChange =
    edit !== null &&
    (edit.plan !== subPlan ||
      (edit.plan !== null && edit.billingId !== subBillingId));

  const isBusy = isUpdating || isCancelling;
  const actionError = updateError ?? cancelError;

  const resetEdit = () => {
    setEdit(null);
    setAgreed(false);
  };

  const handleSave = () => {
    if (plan === null) {
      cancelSubscription({ guildId }, { onSuccess: resetEdit });
      return;
    }
    const dto: UpdateSubscriptionDTO = { billingId: billingId! };
    dto.nextPlan = plan !== subscription.plan ? plan : null;
    updateSubscription({ guildId, dto }, { onSuccess: resetEdit });
  };

  const handleRequestBilling = () => {
    requestBilling();
  };

  return (
    <SecondarySection gap="sm">
      <Title>자동 결제</Title>

      {billingsLoading ? (
        <Loading />
      ) : (
        <Column gap="xs">
          {actionError && (
            <Error error={actionError}>처리 중 오류가 발생했습니다</Error>
          )}
          <Select
            value={plan === null ? "" : String(plan)}
            onChange={(e) => {
              const v = e.target.value;
              setEdit(
                v === ""
                  ? { plan: null, billingId: null }
                  : { plan: Number(v) as Plan, billingId },
              );
              setAgreed(false);
            }}
            variantSize="small"
          >
            <option value={String(Plan.PLUS)}>
              Trader Bot Plus ₩{PLAN_AMOUNT[Plan.PLUS].toLocaleString("ko-KR")}
              /월(30일)
            </option>
            <option value={String(Plan.PRO)}>
              Trader Bot Pro ₩{PLAN_AMOUNT[Plan.PRO].toLocaleString("ko-KR")}
              /월(30일)
            </option>
            <option value="">자동 결제 없음</option>
          </Select>
          {plan !== null && (
            <BillingSelect
              billings={billings ?? []}
              value={billingId}
              onChange={(id) => {
                setEdit({ plan, billingId: id });
                setAgreed(false);
              }}
              onAdd={handleRequestBilling}
              disabled={!user}
            />
          )}
          {plan !== null && !hasChange && (
            <Text variantSize="small">
              만료일에 위 항목으로 자동 결제됩니다.
            </Text>
          )}
          {hasChange && (
            <Column gap="xs">
              {plan !== null && (
                <BillingAgree
                  id="billing-autopay-agree"
                  checked={agreed}
                  onChange={setAgreed}
                />
              )}
              <PrimaryButton
                variantSize="small"
                style={{ width: "100%" }}
                onClick={handleSave}
                disabled={
                  isBusy ||
                  (plan !== null && billingId === null) ||
                  (plan !== null && !agreed)
                }
              >
                저장
              </PrimaryButton>
            </Column>
          )}
        </Column>
      )}
    </SecondarySection>
  );
}
