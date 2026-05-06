import { useBillingCallback } from "@features/billing/hook";
import { Page, Fill, Column } from "@components/atoms/layout";
import { Loading } from "@components/molecules/loading";
import { Error } from "@components/molecules/error";

export function BillingCallbackPage() {
  const { error } = useBillingCallback();

  if (!error)
    return (
      <Page>
        <Fill center>
          <Loading />
        </Fill>
      </Page>
    );

  return (
    <Page>
      <Fill center>
        <Column center gap="md">
          <Error error={error}>결제 수단 등록에 실패했습니다</Error>
        </Column>
      </Fill>
    </Page>
  );
}
