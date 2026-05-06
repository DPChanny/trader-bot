import { createFileRoute } from "@tanstack/react-router";
import { BillingCallbackPage } from "@pages/mePage/billingCallbackPage";

export const Route = createFileRoute("/auth/billing/callback")({
  validateSearch: (search: Record<string, unknown>) => ({
    authKey: (search["authKey"] as string) ?? "",
  }),
  component: function BillingCallbackRoute() {
    const { authKey } = Route.useSearch();
    return <BillingCallbackPage authKey={authKey} />;
  },
});
