import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Route } from "@routes/me";
import { Page, Column, Row, Scroll } from "@components/atoms/layout";
import {
  PrimarySection,
  SecondarySection,
  TertiarySection,
} from "@components/surfaces/section";
import { Title, Text } from "@components/atoms/text";
import { PrimaryButton, DangerButton } from "@components/atoms/button";
import { Card } from "@components/surfaces/card";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";
import { Modal, ModalFooter } from "@components/modal";
import {
  useBillings,
  useDeleteBilling,
  useBillingCallback,
  useRequestBilling,
} from "@features/billing/hook";
import { useMyPayments, useDeleteMyUser, useMyUser } from "@features/user/hook";
import { removeJWTToken } from "@features/auth/token";
import { Plan } from "@features/subscription/dto";
import type { BillingDTO } from "@features/billing/dto";
import type { PaymentDetailDTO } from "@features/payment/dto";

const PLAN_LABEL: Record<Plan, string> = {
  [Plan.PLUS]: "Plus",
  [Plan.PRO]: "Pro",
};

const PLAN_COLOR: Record<Plan, "gold" | "blue"> = {
  [Plan.PLUS]: "blue",
  [Plan.PRO]: "gold",
};

type BillingCardProps = {
  billing: BillingDTO;
  onDelete: () => void;
  isDeleting: boolean;
};

function BillingCard({ billing, onDelete, isDeleting }: BillingCardProps) {
  return (
    <Card direction="row" align="center" justify="between" variantColor="gray">
      <Text>{billing.name || "카드"}</Text>
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

type PaymentCardProps = {
  payment: PaymentDetailDTO;
};

function PaymentCard({ payment }: PaymentCardProps) {
  const date = new Date(payment.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const failed = payment.paymentKey === null;

  return (
    <Card
      direction="column"
      variantColor={failed ? "red" : PLAN_COLOR[payment.plan]}
    >
      <Text variantWeight="bold">
        {`Trader Bot  ${PLAN_LABEL[payment.plan]} - ${payment.guild?.name ?? "알 수 없음"} `}
      </Text>
      <Text variantSize="small">
        {`${payment.billing?.name ?? "알 수 없음"} - ${payment.amount.toLocaleString("ko-KR")}원`}
      </Text>
      <Text variantSize="small">{date}</Text>
    </Card>
  );
}

export function MePage() {
  const navigate = useNavigate();
  const { authKey, code } = Route.useSearch();
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

  const { error: billingCallbackError } = useBillingCallback({ authKey, code });
  const { requestBilling } = useRequestBilling();

  const handleRequestBilling = () => {
    if (!user) return;
    requestBilling({ customerKey: `u-${user.discordId}` });
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
        <PrimarySection width="page" fill>
          <SecondarySection fill minSize>
            <Row justify="between" align="center">
              <Title align="start">결제 수단</Title>
              <PrimaryButton
                variantSize="small"
                onClick={handleRequestBilling}
                disabled={!user}
              >
                추가
              </PrimaryButton>
            </Row>

            {billingCallbackError && (
              <Error error={billingCallbackError}>
                결제 수단 추가에 실패했습니다
              </Error>
            )}
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
            ) : !billings?.length ? (
              <TertiarySection fill center>
                <Text>등록된 결제 수단이 없습니다.</Text>
              </TertiarySection>
            ) : (
              <TertiarySection fill>
                <Column gap="sm">
                  {billings.map((b) => (
                    <BillingCard
                      key={b.billingId}
                      billing={b}
                      onDelete={() => deleteBilling({ billingId: b.billingId })}
                      isDeleting={isDeleting}
                    />
                  ))}
                </Column>
              </TertiarySection>
            )}
            <Text tone="accent">
              결제 수단을 등록하면 자동결제에 동의한 것으로 간주됩니다. 수단
              삭제 시 해당 수단에 연결된 구독의 자동결제가 중단됩니다.
            </Text>
          </SecondarySection>

          <SecondarySection fill minSize>
            <Title align="start">결제 내역</Title>
            {paymentsLoading ? (
              <TertiarySection fill>
                <Loading />
              </TertiarySection>
            ) : !(payments ?? []).length ? (
              <TertiarySection fill center>
                <Text>결제 내역이 없습니다.</Text>
              </TertiarySection>
            ) : (
              <TertiarySection minSize>
                <Scroll axis="y">
                  {[...payments!].reverse().map((p) => (
                    <PaymentCard key={p.paymentId} payment={p} />
                  ))}
                </Scroll>
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
