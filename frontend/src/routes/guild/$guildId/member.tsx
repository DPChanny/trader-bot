import { createFileRoute } from "@tanstack/react-router";
import { MemberPage } from "@pages/memberPage/memberPage";

export const Route = createFileRoute("/guild/$guildId/member")({
  component: MemberPage,
});
