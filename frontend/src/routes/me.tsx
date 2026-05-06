import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkJWTToken, getRefreshToken } from "@features/auth/token";
import { MePage } from "@pages/mePage/mePage";

export const Route = createFileRoute("/me")({
  beforeLoad: () => {
    if (!checkJWTToken(getRefreshToken())) {
      throw redirect({ to: "/", replace: true });
    }
  },
  component: MePage,
});
