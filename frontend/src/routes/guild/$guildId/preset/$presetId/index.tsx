import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkJWTToken, getRefreshToken } from "@features/auth/token";
import { PresetPage } from "@pages/presetPage/presetPage";

export const Route = createFileRoute("/guild/$guildId/preset/$presetId/")({
  beforeLoad: () => {
    if (!checkJWTToken(getRefreshToken())) {
      throw redirect({ to: "/", replace: true });
    }
  },
  component: PresetPage,
});
