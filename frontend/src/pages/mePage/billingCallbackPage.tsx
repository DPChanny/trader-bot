import { useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Page, Fill } from "@components/atoms/layout";
import { Loading } from "@components/molecules/loading";
import { useRegisterBilling } from "@features/billing/hook";

type BillingCallbackPageProps = {
  authKey: string;
};

export function BillingCallbackPage({ authKey }: BillingCallbackPageProps) {
  const navigate = useNavigate();
  const { mutate: registerBilling } = useRegisterBilling();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    if (!authKey) {
      void navigate({ to: "/me", replace: true });
      return;
    }

    registerBilling(
      { authKey },
      {
        onSettled: () => void navigate({ to: "/me", replace: true }),
      },
    );
  }, [authKey, navigate, registerBilling]);

  return (
    <Page>
      <Fill center>
        <Loading />
      </Fill>
    </Page>
  );
}
