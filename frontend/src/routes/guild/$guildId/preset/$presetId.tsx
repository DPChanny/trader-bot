import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/guild/$guildId/preset/$presetId")({
  component: Outlet,
});
