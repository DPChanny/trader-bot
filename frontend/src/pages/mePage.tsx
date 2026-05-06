import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Page, Column, Row } from "@components/atoms/layout";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Title, Text } from "@components/atoms/text";
import { PrimaryButton, DangerButton } from "@components/atoms/button";
import { Badge } from "@components/atoms/badge";
import { Card } from "@components/surfaces/card";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { Modal, ModalFooter } from "@components/modal";
import { useBillings, useDeleteBilling } from "@features/billing/hook";
import { useMyPayments, useDeleteMyUser, useMyUser } from "@features/user/hook";
import { requestBillingAuth } from "@features/billing/api";
import { removeJWTToken } from "@features/auth/token";
import { Plan } from "@features/subscription/dto";
import type { BillingDTO } from "@features/billing/dto";

const PLAN_LABEL: Record<Plan, string> = {
  [Plan.PLUS]: "Plus",
  [Plan.PRO]: "Pro",
};

const PLAN_COLOR: Record<Plan, "gold" | "blue"> = {
  [Plan.PLUS]: "gold",
  [Plan.PRO]: "blue",
};

type BillingCardProps = {
  billing: BillingDTO;
  index: number;
  onDelete: () => void;
  isDeleting: boolean;
};

function BillingCard({ index, onDelete, isDeleting }: BillingCardProps) {
  return (
    <Card direction="row" align="center" justify="between" variantColor="gray">
      <Text>결제 수단 #{index + 1}</Text>
      <DangerButton
        variantSize="small"
        onClick={onDelete}
        disabled={isDeleting}
      >
        삭제
      </DangerButton>
    </Card>
  );
}

export function MePage() {
  const navigate = useNavigate();
  const { data: user } = useMyUser();
  const {
    data: billings,
    isLoading: billingsLoading,
    error: billingsError,
  } = useBillings();
  const { data: payments, isLoading: paymentsLoading } = useMyPayments();
  const { mutate: deleteBilling, isPending: isDeleting } = useDeleteBilling();
  const { mutate: deleteMyUser, isPending: isWithdrawing } = useDeleteMyUser();

  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  const handleAddBilling = () => {
    if (!user) return;
    void requestBillingAuth({
      customerKey: user.discordId,
      redirectPath: "/me",
    });
  };

  const handleWithdraw = () => {
    deleteMyUser(undefined, {
      onSuccess: () => {
        removeJWTToken();
        navigate({ to: "/", replace: true });
      },
    });
  };

  return (
    <Page>
      <Column align="center" fill>
        <PrimarySection width="page" minSize fill>
          <SecondarySection fill gap="md">
            <Row justify="between" align="center">
              <Title align="start">결제 수단</Title>
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
            ) : billingsError ? (
              <TertiarySection fill>
                <Error error={billingsError}>
                  결제 수단을 불러오지 못했습니다
                </Error>
              </TertiarySection>
            ) : (
              <TertiarySection fill>
                <Column gap="sm">
                  {billings?.map((b, i) => (
                    <BillingCard
                      key={b.billingId}
                      billing={b}
                      index={i}
                      onDelete={() => deleteBilling({ billingId: b.billingId })}
                      isDeleting={isDeleting}
                    />
                  ))}
                </Column>
              </TertiarySection>
            )}
          </SecondarySection>

          <SecondarySection fill gap="md">
            <Title align="start">결제 내역</Title>
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

          <DangerButton
            variantSize="small"
            onClick={() => setShowWithdrawModal(true)}
          >
            초기화
          </DangerButton>
        </PrimarySection>
      </Column>

      {showWithdrawModal && (
        <Modal title="초기화" onClose={() => setShowWithdrawModal(false)}>
          <Text>
            결제 수단, 결제 내역이 삭제됩니다. Discord 계정 및 서버 정보는
            정책상 유지됩니다.
          </Text>
          <ModalFooter>
            <Row gap="sm" justify="end">
              <PrimaryButton
                variantSize="small"
                onClick={() => setShowWithdrawModal(false)}
                disabled={isWithdrawing}
              >
                취소
              </PrimaryButton>
              <DangerButton
                variantSize="small"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
              >
                초기화
              </DangerButton>
            </Row>
          </ModalFooter>
        </Modal>
      )}
    </Page>
  );
}
