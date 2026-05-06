import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkJWTToken, getRefreshToken } from "@features/auth/token";
import { GuildPage } from "@pages/guildPage/guildPage";

export const Route = createFileRoute("/guild/$guildId/member")({
  beforeLoad: () => {
    if (!checkJWTToken(getRefreshToken())) {
      throw redirect({ to: "/", replace: true });
    }
  },
  component: GuildPage,
});
