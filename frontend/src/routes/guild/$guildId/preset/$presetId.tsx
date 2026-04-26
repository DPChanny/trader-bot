import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { checkJWTToken, getRefreshToken } from "@features/auth/token";

export const Route = createFileRoute("/guild/$guildId/preset/$presetId")({
  beforeLoad: () => {
    if (!checkJWTToken(getRefreshToken())) {
      throw redirect({ to: "/", replace: true });
    }
  },
  component: Outlet,
});
