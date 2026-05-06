import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkJWTToken, getRefreshToken } from "@features/auth/token";
import { SubscriptionPage } from "@pages/guildPage/subscriptionPage";

export const Route = createFileRoute("/guild/$guildId/subscription")({
  beforeLoad: () => {
    if (!checkJWTToken(getRefreshToken())) {
      throw redirect({ to: "/", replace: true });
    }
  },
  component: SubscriptionPage,
});
