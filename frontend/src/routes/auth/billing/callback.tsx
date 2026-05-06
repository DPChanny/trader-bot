import { createFileRoute } from "@tanstack/react-router";
import { BillingCallbackPage } from "@pages/billingCallbackPage";

export const Route = createFileRoute("/auth/billing/callback")({
  component: BillingCallbackPage,
});
