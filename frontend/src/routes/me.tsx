import { createFileRoute, redirect } from "@tanstack/react-router";
import { checkJWTToken, getRefreshToken } from "@features/auth/token";
import { MePage } from "@pages/mePage";

export const Route = createFileRoute("/me")({
  validateSearch: (search: Record<string, unknown>) => ({
    authKey: search.authKey as string | undefined,
    code: search.code as string | undefined,
  }),
  beforeLoad: () => {
    if (!checkJWTToken(getRefreshToken())) {
      throw redirect({ to: "/", replace: true });
    }
  },
  component: MePage,
});
