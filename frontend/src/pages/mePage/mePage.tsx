import { Page, Column, Row, Fill } from "@components/atoms/layout";
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
import { useBillings, useDeleteBilling } from "@features/billing/hook";
import { requestBillingAuth } from "@features/billing/api";
import { useMyUser } from "@features/user/hook";
import type { BillingDTO } from "@features/billing/dto";

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
  const { data: user } = useMyUser();
  const { data: billings, isLoading, error } = useBillings();
  const { mutate: deleteBilling, isPending: isDeleting } = useDeleteBilling();

  const handleAddBilling = () => {
    if (!user) return;
    void requestBillingAuth({
      customerKey: user.discordId,
      successUrl: `${window.location.origin}/auth/billing/callback`,
      failUrl: `${window.location.origin}/me`,
    });
  };

  return (
    <Page>
      <PrimarySection fill padding="xl">
        <Column gap="lg">
          <Title align="start">내 계정</Title>
          <SecondarySection>
            <Column gap="md">
              <Row justify="between" align="center">
                <Title align="start">결제 수단</Title>
                <PrimaryButton
                  variantSize="small"
                  onClick={handleAddBilling}
                  disabled={!user}
                >
                  카드 추가
                </PrimaryButton>
              </Row>
              {isLoading ? (
                <TertiarySection>
                  <Fill center>
                    <Loading />
                  </Fill>
                </TertiarySection>
              ) : error ? (
                <Error error={error}>결제 수단을 불러오지 못했습니다</Error>
              ) : !billings?.length ? (
                <TertiarySection>
                  <Text>등록된 결제 수단이 없습니다</Text>
                </TertiarySection>
              ) : (
                <Column gap="sm">
                  {billings.map((b, i) => (
                    <BillingCard
                      key={b.billingId}
                      billing={b}
                      index={i}
                      onDelete={() => deleteBilling({ billingId: b.billingId })}
                      isDeleting={isDeleting}
                    />
                  ))}
                </Column>
              )}
            </Column>
          </SecondarySection>
        </Column>
      </PrimarySection>
    </Page>
  );
}
