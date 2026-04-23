import { createFileRoute } from "@tanstack/react-router";
import { LoginCallbackPage } from "@pages/loginCallbackPage";

export const Route = createFileRoute("/auth/login/callback")({
  component: LoginCallbackPage,
});
