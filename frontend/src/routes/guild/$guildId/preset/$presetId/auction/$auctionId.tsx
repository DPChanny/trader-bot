import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkJWTToken, getRefreshToken } from "@features/auth/token";
import { AuctionPage } from "@pages/auctionPage/auctionPage";

export const Route = createFileRoute(
  "/guild/$guildId/preset/$presetId/auction/$auctionId",
)({
  beforeLoad: () => {
    if (!checkJWTToken(getRefreshToken())) {
      throw redirect({ to: "/", replace: true });
    }
  },
  component: AuctionPage,
});
