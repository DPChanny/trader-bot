import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkJWTToken, getRefreshToken } from "@features/auth/token";
import { MemberPage } from "@pages/memberPage/memberPage";

export const Route = createFileRoute("/guild/$guildId/member")({
  beforeLoad: () => {
    if (!checkJWTToken(getRefreshToken())) {
      throw redirect({ to: "/", replace: true });
    }
  },
  component: MemberPage,
});
