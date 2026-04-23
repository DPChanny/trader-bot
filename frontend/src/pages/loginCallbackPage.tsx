import { useLoginCallback } from "@features/auth/hook";
import { Page, Fill, Column } from "@components/atoms/layout";
import { Error } from "@components/molecules/error";
import { PrimaryButton } from "@components/atoms/button";

export function LoginCallbackPage() {
  const { error, retry } = useLoginCallback();

  if (!error) return null;

  return (
    <Page>
      <Fill center>
        <Column center gap="md">
          <Error error={error}>로그인에 실패했습니다</Error>
          <PrimaryButton onClick={retry}>재시도</PrimaryButton>
        </Column>
      </Fill>
    </Page>
  );
}
